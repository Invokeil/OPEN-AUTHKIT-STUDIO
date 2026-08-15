export type DatabaseProvider =
  | "memory"
  | "supabase"
  | "firebase"
  | "postgres"
  | "sqlite"
  | "cloudflare-d1"
  | "cloudflare-kv";

export interface UserRecord {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStore {
  getByEmail(email: string): Promise<UserRecord | null>;
  upsert(
    user: Omit<UserRecord, "createdAt" | "updatedAt">
  ): Promise<UserRecord>;
}

export interface StorageConfig {
  provider: DatabaseProvider;
  tableName: string;
  namespace?: string;
}

export const supportedDatabaseProviders: readonly DatabaseProvider[] = [
  "memory",
  "supabase",
  "firebase",
  "postgres",
  "sqlite",
  "cloudflare-d1",
  "cloudflare-kv",
];

export function parseDatabaseProvider(
  value: string | undefined
): DatabaseProvider {
  const normalized = value?.trim().toLowerCase() as
    | DatabaseProvider
    | undefined;
  return normalized && supportedDatabaseProviders.includes(normalized)
    ? normalized
    : "memory";
}

export function getStorageConfig(
  env: NodeJS.ProcessEnv = process.env
): StorageConfig {
  return {
    provider: parseDatabaseProvider(env.DATABASE_PROVIDER),
    tableName: env.DATABASE_TABLE?.trim() || "auth_users",
    namespace: env.DATABASE_NAMESPACE?.trim() || undefined,
  };
}
