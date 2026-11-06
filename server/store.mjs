import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import { demoData } from "./seed.mjs";

export const entities = [
  "customers",
  "jobs",
  "inventory",
  "invoices",
  "readings",
  "sales",
  "workflows",
  "messages",
  "tasks",
];
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function createStore(path, seed = true) {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  db.exec(
    "CREATE TABLE IF NOT EXISTS records (entity TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, PRIMARY KEY(entity,id)); CREATE TABLE IF NOT EXISTS audit (id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT NOT NULL, entity TEXT NOT NULL, record_id TEXT, created_at TEXT NOT NULL); CREATE TABLE IF NOT EXISTS portal_tokens (hash TEXT PRIMARY KEY, customer_id TEXT NOT NULL, expires_at INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);",
  );
  const list = (entity) =>
    db
      .prepare("SELECT data,version FROM records WHERE entity=? ORDER BY rowid")
      .all(entity)
      .map((r) => ({ ...JSON.parse(r.data), version: r.version }));
  const get = (entity, id) => {
    const r = db
      .prepare("SELECT data,version FROM records WHERE entity=? AND id=?")
      .get(entity, id);
    return r ? { ...JSON.parse(r.data), version: r.version } : null;
  };
  const insert = (entity, data) => {
    const record = { ...data, id: data.id || randomUUID() };
    delete record.version;
    db.prepare("INSERT INTO records(entity,id,data) VALUES(?,?,?)").run(
      entity,
      record.id,
      JSON.stringify(record),
    );
    return get(entity, record.id);
  };
  const update = (entity, id, data, version) => {
    const result = db
      .prepare(
        "UPDATE records SET data=?,version=version+1 WHERE entity=? AND id=? AND version=?",
      )
      .run(JSON.stringify({ ...data, id }), entity, id, version);
    if (!result.changes)
      throw Object.assign(
        new Error(
          "This record changed in another window. Refresh and try again.",
        ),
        { status: 409 },
      );
    return get(entity, id);
  };
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  const audit = (event, entity, id) =>
    db
      .prepare(
        "INSERT INTO audit(event,entity,record_id,created_at) VALUES(?,?,?,?)",
      )
      .run(event, entity, id || null, new Date().toISOString());
  if (seed && !db.prepare("SELECT 1 FROM records LIMIT 1").get())
    transaction(() => {
      for (const [entity, rows] of Object.entries(demoData(today())))
        for (const row of rows) insert(entity, row);
    });
  return {
    db,
    list,
    get,
    insert,
    update,
    transaction,
    audit,
    close: () => db.close(),
  };
}
