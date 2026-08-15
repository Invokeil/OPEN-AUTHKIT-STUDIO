# Database Adapter Implementation Guide

এই guide-টি `server/storage/types.ts`-এর `UserStore` contract ধরে লেখা। Application-এর demo mode কোনো database চায় না। বাস্তব persistence চাইলে শুধুমাত্র server runtime-এ একটি adapter লিখুন এবং `server/storage/index.ts`-এ provider factory-তে register করুন।

## Shared schema

সব provider-এ email lower-case করে unique রাখুন। কোনো password column রাখবেন না; password verification identity provider-এর দায়িত্বে থাকবে।

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

SQLite-তে `timestamptz`-এর বদলে `text` ব্যবহার করুন এবং timestamp UTC ISO string হিসেবে লিখুন। D1-এ `text` primary key ও `text not null` ব্যবহার করুন।

## Supabase

Supabase dashboard-এ migration চালিয়ে table ও RLS policy তৈরি করুন। Browser থেকে direct profile access দরকার হলে user JWT অনুযায়ী narrow policy লিখুন। Server-side service-role client policy bypass করতে পারে, তাই সেটি secret manager-এ রাখুন এবং browser bundle-এ পাঠাবেন না [1]।

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

Firebase Admin SDK server-only environment-এ initialize করুন। Firestore document ID হিসেবে verified provider UID ব্যবহার করুন; unverified email দিয়ে privileged write করবেন না [2]।

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

Firebase service account JSON কখনো Git বা `VITE_*` variable-এ রাখবেন না। Prefer deployment secret manager বা workload identity।

## PostgreSQL

`pg` pool ব্যবহার করুন এবং সব user input parameterized query-তে পাঠান [3]। Migration tool দিয়ে schema version করুন।

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

Production database role-এ শুধু প্রয়োজনীয় table privilege দিন। Connection timeout, pool limit, TLS এবং graceful shutdown যোগ করুন।

## SQLite

SQLite self-hosted single-node deployment-এর জন্য সহজ। Serverless multi-instance deployment-এ local file consistency ধরে নেওয়া যাবে না।

```bash
pnpm add better-sqlite3
```

`better-sqlite3` adapter-এ startup migration চালান, prepared statement ব্যবহার করুন, email unique index রাখুন এবং database file-কে static directory-এর বাইরে রাখুন। Container ব্যবহার করলে volume mount এবং backup policy যোগ করুন।

## Cloudflare D1

D1 হলো Workers runtime-এর binding-based SQL database। Express server-এর `process.env` দিয়ে D1 binding পাওয়া যাবে না; Worker handler-এ `env.DB` binding গ্রহণ করে adapter তৈরি করতে হবে। D1 prepared statement ও batch API ব্যবহার করুন [4]।

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

KV key-value store session/cache বা low-contention profile lookup-এ ব্যবহার করুন; authoritative relational user table হিসেবে নয়। KV binding Worker runtime-এ `env.AUTH_KV` দিয়ে পাওয়া যায় এবং read-after-write consistency assumptions সীমিত রাখতে হবে [5]। Identity uniqueness ও transactional update দরকার হলে D1 ব্যবহার করুন।

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

শেষে `server/storage/index.ts`-এ environment অনুযায়ী adapter register করুন। External provider configure করা থাকলেও corresponding adapter code না থাকা অবস্থায় application start করাবেন না। এই repository-র default factory ইচ্ছাকৃতভাবে error করে, যাতে “connected” মিথ্যা status না দেখায়।

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
