import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createStore } from "../server/store.mjs";
test("saved records survive closing and reopening the database without reseeding", () => {
  const dir = mkdtempSync(join(tmpdir(), "current-persistence-"));
  const path = join(dir, "current.sqlite");
  const store = createStore(path);
  const previous = store.get("inventory", "p2");
  const { version, ...data } = previous;
  store.update("inventory", "p2", { ...data, stock: 27 }, version);
  store.close();
  const reopened = createStore(path);
  try {
    assert.equal(reopened.get("inventory", "p2").stock, 27);
    assert.equal(reopened.get("inventory", "p2").version, 2);
    assert.equal(reopened.list("customers").length, 12);
  } finally {
    reopened.close();
  }
});
