import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { getDbPath, getLogsDir } from "../utils/paths.js";

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DatabaseSync } = require("node:sqlite") as typeof import("node:sqlite");

type DatabaseSyncType = InstanceType<typeof DatabaseSync>;

let _db: DatabaseSyncType | null = null;

export function getDatabase(dbPath?: string): DatabaseSyncType {
  if (_db && !dbPath) return _db;

  const resolvedPath = dbPath ?? getDbPath();

  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const logsDir = getLogsDir();
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  const sqlite = new DatabaseSync(resolvedPath);
  runMigrations(sqlite);

  if (!dbPath) {
    _db = sqlite;
  }

  return sqlite;
}

export function runMigrations(sqlite: DatabaseSyncType): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      project_type TEXT,
      project_path TEXT,
      response TEXT,
      error TEXT,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
  `);
}

export function closeDatabase(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function resetDatabaseForTests(): void {
  if (_db) {
    try {
      _db.close();
    } catch {
      // ignore
    }
    _db = null;
  }
}

export type AppDatabase = DatabaseSyncType;
