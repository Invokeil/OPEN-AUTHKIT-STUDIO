import { createMemoryStore } from "./memory";
import { getStorageConfig, type StorageConfig, type UserStore } from "./types";

export { createMemoryStore } from "./memory";
export { getStorageConfig, supportedDatabaseProviders } from "./types";
export type {
  DatabaseProvider,
  StorageConfig,
  UserRecord,
  UserStore,
} from "./types";

export function createConfiguredStore(
  config: StorageConfig = getStorageConfig()
): UserStore {
  if (config.provider !== "memory") {
    throw new Error(
      `DATABASE_PROVIDER=${config.provider} is configured but no adapter is enabled in this demo package. ` +
        "Implement the UserStore contract in server/storage and keep provider credentials server-side."
    );
  }
  return createMemoryStore();
}
