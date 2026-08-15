import { describe, expect, it } from "vitest";
import { createMemoryStore } from "../server/storage/memory";
import { parseDatabaseProvider } from "../server/storage/types";

describe("storage contract", () => {
  it("defaults unknown providers to memory", () => {
    expect(parseDatabaseProvider(undefined)).toBe("memory");
    expect(parseDatabaseProvider("not-a-provider")).toBe("memory");
    expect(parseDatabaseProvider("postgres")).toBe("postgres");
  });

  it("normalizes email keys and keeps timestamps stable on updates", async () => {
    const store = createMemoryStore();
    const first = await store.upsert({
      id: "user-1",
      email: "Demo@Example.test",
      displayName: "Demo",
    });
    const second = await store.upsert({
      id: "user-1",
      email: "demo@example.test",
      displayName: "Updated Demo",
    });
    const loaded = await store.getByEmail(" DEMO@example.test ");

    expect(first.email).toBe("demo@example.test");
    expect(second.createdAt).toBe(first.createdAt);
    expect(second.updatedAt).not.toBe("");
    expect(loaded?.displayName).toBe("Updated Demo");
  });
});
