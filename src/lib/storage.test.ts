import { beforeEach, describe, expect, it } from "vitest";
import { loadStore, saveStore, resetStore, STORE_KEY } from "./storage";
import { EMPTY_STORE } from "./types";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns EMPTY_STORE when nothing saved", () => {
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("roundtrips a saved store", () => {
    const s = { ...EMPTY_STORE, settings: { ...EMPTY_STORE.settings, fontSize: 18 } };
    saveStore(s);
    expect(loadStore()).toEqual(s);
  });

  it("recovers from corrupted JSON", () => {
    localStorage.setItem(STORE_KEY, "{not json");
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("rejects wrong-version store and returns empty", () => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ version: 999 }));
    expect(loadStore()).toEqual(EMPTY_STORE);
  });

  it("resetStore wipes the store", () => {
    saveStore({ ...EMPTY_STORE, settings: { ...EMPTY_STORE.settings, fontSize: 20 } });
    resetStore();
    expect(loadStore()).toEqual(EMPTY_STORE);
  });
});
