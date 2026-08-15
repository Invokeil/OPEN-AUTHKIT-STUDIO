import type { UserRecord, UserStore } from "./types";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createMemoryStore(): UserStore {
  const users = new Map<string, UserRecord>();

  return {
    async getByEmail(email) {
      return users.get(normalizeEmail(email)) || null;
    },
    async upsert(user) {
      const now = new Date().toISOString();
      const key = normalizeEmail(user.email);
      const existing = users.get(key);
      const record: UserRecord = {
        ...user,
        email: key,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      users.set(key, record);
      return record;
    },
  };
}
