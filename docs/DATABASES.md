# Database Adapter Implementation Guide

This guide is based on the `UserStore` contract in `server/storage/types.ts`. The application demo mode does not require a database. For real persistence, write an adapter only in the server runtime and register it in the provider factory in `server/storage/index.ts`.

## Shared schema

For every provider, normalize email addresses to lowercase and enforce uniqueness. Do not add a password column; password verification belongs to the identity provider.

```sql
create table auth_users (
  id text primary key,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index auth_users_email_lower_idx on auth_users (lower(email));
```

For SQLite, use `text` instead of `timestamptz` and store timestamps as UTC ISO strings. For D1, use a `text` primary key and `text not null` columns.

## Supabase

Run the migration in the Supabase dashboard to create the table and RLS policy. If direct profile access from the browser is required, write a narrow policy based on the user JWT. A server-side service-role client can bypass policy, so keep it in a secret manager and never send it to the browser bundle [1].

```bash
pnpm add @supabase/supabase-js
```

```ts
import { createClient } from "@supabase/supabase-js";
import type { UserStore } from "../types";

export function createSupabaseStore(): UserStore {
  const client = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return {
    async getByEmail(email) {
      const { data, error } = await client
        .from("auth_users")
        .select("*")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async upsert(user) {
      const { data, error } = await client
        .from("auth_users")
        .upsert(
          {
            id: user.id,
            email: user.email.trim().toLowerCase(),
            display_name: user.displayName,
          },
          { onConflict: "email" }
        )
        .select("*")
        .single();
      if (error) throw error;
      return {
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
  };
}
```

## Firebase Firestore

Initialize the Firebase Admin SDK only in a server environment. Use the verified provider UID as the Firestore document ID; do not perform privileged writes using an unverified email [2].

```bash
pnpm add firebase-admin
```

```ts
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { UserStore } from "../types";

const app =
  getApps()[0] ||
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON!)),
  });
const db = getFirestore(app);

export function createFirebaseStore(): UserStore {
  const collection = db.collection("auth_users");
  return {
    async getByEmail(email) {
      const snapshot = await collection
        .where("email", "==", email.trim().toLowerCase())
        .limit(1)
        .get();
      return snapshot.empty ? null : (snapshot.docs[0].data() as never);
    },
    async upsert(user) {
      const now = new Date().toISOString();
      const record = {
        ...user,
        email: user.email.trim().toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };
      await collection.doc(user.id).set(record, { merge: true });
      return record;
    },
  };
}
```

Never store the Firebase service-account JSON in Git or in a `VITE_*` variable. Prefer a deployment secret manager or workload identity.

## PostgreSQL

Use a `pg` pool and send all user input through parameterized queries [3]. Version the schema with a migration tool.

```bash
pnpm add pg
```

```ts
import { Pool } from "pg";
import type { UserStore } from "../types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : undefined,
});

export function createPostgresStore(): UserStore {
  return {
    async getByEmail(email) {
      const result = await pool.query(
        "select id, email, display_name, created_at, updated_at from auth_users where lower(email) = lower($1) limit 1",
        [email.trim()]
      );
      const row = result.rows[0];
      return row
        ? {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            createdAt: row.created_at.toISOString(),
            updatedAt: row.updated_at.toISOString(),
          }
        : null;
    },
    async upsert(user) {
      const result = await pool.query(
        "insert into auth_users (id, email, display_name) values ($1, lower($2), $3) on conflict (email) do update set display_name = excluded.display_name, updated_at = now() returning id, email, display_name, created_at, updated_at",
        [user.id, user.email.trim(), user.displayName || null]
      );
      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        displayName: row.display_name,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      };
    },
  };
}
```

Grant the production database role only the required table privileges. Add connection timeouts, pool limits, TLS, and graceful shutdown.

## SQLite

SQLite is convenient for a self-hosted single-node deployment. Do not assume local-file consistency in a serverless multi-instance deployment.

```bash
pnpm add better-sqlite3
```

In a `better-sqlite3` adapter, run the startup migration, use prepared statements, keep a unique email index, and store the database file outside the static directory. When using a container, add a volume mount and a backup policy.

## Cloudflare D1

D1 is a binding-based SQL database for the Workers runtime. An Express server cannot access a D1 binding through `process.env`; the Worker handler must receive the `env.DB` binding and create the adapter from it. Use D1 prepared statements and the batch API [4].

```ts
export function createD1Store(db: D1Database): UserStore {
  return {
    async getByEmail(email) {
      const row = await db
        .prepare(
          "select id, email, display_name, created_at, updated_at from auth_users where email = ? limit 1"
        )
        .bind(email.trim().toLowerCase())
        .first<any>();
      return row
        ? {
            id: row.id,
            email: row.email,
            displayName: row.display_name,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        : null;
    },
    async upsert(user) {
      const now = new Date().toISOString();
      await db
        .prepare(
          "insert into auth_users (id, email, display_name, created_at, updated_at) values (?, ?, ?, ?, ?) on conflict(email) do update set display_name = excluded.display_name, updated_at = excluded.updated_at"
        )
        .bind(
          user.id,
          user.email.trim().toLowerCase(),
          user.displayName || null,
          now,
          now
        )
        .run();
      return {
        ...user,
        email: user.email.trim().toLowerCase(),
        createdAt: now,
        updatedAt: now,
      };
    },
  };
}
```

## Cloudflare KV

Use KV for session/cache data or low-contention profile lookups, not as the authoritative relational user table. The KV binding is available as `env.AUTH_KV` in the Worker runtime, and read-after-write consistency assumptions must remain limited [5]. Use D1 when identity uniqueness and transactional updates are required.

```ts
export function createKvProfileStore(kv: KVNamespace): UserStore {
  return {
    async getByEmail(email) {
      return kv.get(`user:email:${email.trim().toLowerCase()}`, "json");
    },
    async upsert(user) {
      const record = {
        ...user,
        email: user.email.trim().toLowerCase(),
        updatedAt: new Date().toISOString(),
      };
      await kv.put(`user:email:${record.email}`, JSON.stringify(record));
      await kv.put(`user:id:${record.id}`, JSON.stringify(record));
      return record;
    },
  };
}
```

## Provider factory registration

Finally, register the adapter in `server/storage/index.ts` according to the environment. Do not start the application when an external provider is configured but the corresponding adapter code is missing. The repository's default factory intentionally fails, rather than displaying a false “connected” status.

```ts
const config = getStorageConfig();
if (config.provider === "postgres") return createPostgresStore();
if (config.provider === "supabase") return createSupabaseStore();
return createMemoryStore();
```

## References

[1]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security"
[2]: https://firebase.google.com/docs/admin/setup "Firebase Admin SDK setup"
[3]: https://node-postgres.com/features/queries "node-postgres parameterized queries"
[4]: https://developers.cloudflare.com/d1/worker-api/ "Cloudflare D1 Worker API"
[5]: https://developers.cloudflare.com/kv/api/ "Cloudflare KV Binding API"
