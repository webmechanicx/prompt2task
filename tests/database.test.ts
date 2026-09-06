import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { getDatabase, closeDatabase, resetDatabaseForTests } from "../src/storage/database.js";
import { TaskRepository } from "../src/storage/repositories/task-repository.js";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "p2t-db-"));
  dbPath = path.join(tmpDir, "test.db");
  resetDatabaseForTests();
});

afterEach(() => {
  closeDatabase();
  resetDatabaseForTests();
  try {
    rmSync(tmpDir, { recursive: true, force: true });
  } catch {}
});

function makeTask(overrides: Partial<any> = {}) {
  return {
    id: `tsk_${Math.random().toString(36).slice(2, 8)}`,
    prompt: "Build a login page",
    status: "pending" as const,
    provider: "openai",
    model: "gpt-5",
    projectType: "react",
    projectPath: "/tmp/project",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("database & task repository", () => {
  it("initializes database and creates table", () => {
    const db = getDatabase(dbPath);
    expect(db).toBeDefined();
    const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'").all();
    expect(rows.length).toBe(1);
  });

  it("creates task", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const task = makeTask();
    repo.create(task);
    const fetched = repo.findById(task.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.prompt).toBe(task.prompt);
  });

  it("updates task", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const task = makeTask({ status: "pending" });
    repo.create(task);
    repo.update(task.id, { status: "completed", response: "done" });
    const fetched = repo.findById(task.id);
    expect(fetched!.status).toBe("completed");
    expect(fetched!.response).toBe("done");
  });

  it("lists tasks", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const t1 = makeTask({ id: "tsk_aaa", createdAt: new Date(Date.now() - 10000).toISOString() });
    const t2 = makeTask({ id: "tsk_bbb", createdAt: new Date().toISOString() });
    repo.create(t1);
    repo.create(t2);
    const list = repo.list();
    expect(list.length).toBe(2);
    expect(list[0].id).toBe("tsk_bbb"); // descending
  });

  it("lists with status filter", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    repo.create(makeTask({ id: "tsk_1", status: "completed" }));
    repo.create(makeTask({ id: "tsk_2", status: "failed" }));
    const completed = repo.list({ status: "completed" });
    expect(completed.length).toBe(1);
    expect(completed[0].id).toBe("tsk_1");
  });

  it("lists with limit", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    for (let i = 0; i < 5; i++) {
      repo.create(makeTask({ id: `tsk_${i}`, createdAt: new Date(Date.now() + i * 1000).toISOString() }));
    }
    const limited = repo.list({ limit: 2 });
    expect(limited.length).toBe(2);
  });

  it("searches tasks", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    repo.create(makeTask({ id: "tsk_search1", prompt: "Build authentication flow" }));
    repo.create(makeTask({ id: "tsk_search2", prompt: "Fix dashboard layout" }));
    const results = repo.search("authentication");
    expect(results.length).toBe(1);
    expect(results[0].id).toBe("tsk_search1");
  });

  it("searches in response", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const t = makeTask({ id: "tsk_resp", prompt: "hello", response: "authentication token" });
    repo.create(t);
    repo.update(t.id, { response: "authentication token", status: "completed" });
    const results = repo.search("token");
    expect(results.length).toBe(1);
  });

  it("retrieves by id and returns null for missing", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    expect(repo.findById("nonexistent")).toBeNull();
  });

  it("migrations are idempotent", () => {
    const db1 = getDatabase(dbPath);
    db1.prepare("INSERT INTO tasks (id,prompt,status,provider,model,created_at) VALUES (?,?,?,?,?,?)").run("tsk_mig","p","pending","openai","gpt-5", new Date().toISOString());
    closeDatabase();
    resetDatabaseForTests();
    const db2 = getDatabase(dbPath);
    const rows = db2.prepare("SELECT * FROM tasks").all();
    expect(rows.length).toBe(1);
  });
});
