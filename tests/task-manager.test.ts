import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { getDatabase, closeDatabase, resetDatabaseForTests } from "../src/storage/database.js";
import { TaskRepository } from "../src/storage/repositories/task-repository.js";
import { TaskManager } from "../src/tasks/task-manager.js";
import type { AIProvider } from "../src/providers/provider.js";

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "p2t-tm-"));
  dbPath = path.join(tmpDir, "test.db");
  resetDatabaseForTests();
});

afterEach(() => {
  closeDatabase();
  resetDatabaseForTests();
  rmSync(tmpDir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

function mockProvider(overrides: Partial<AIProvider> = {}): AIProvider {
  return {
    name: "openai",
    validateCredentials: vi.fn().mockResolvedValue(true),
    sendTask: vi.fn().mockResolvedValue({ content: "Mocked response", model: "gpt-5" }),
    ...overrides,
  };
}

describe("task-manager", () => {
  it("pending -> running -> completed", async () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const provider = mockProvider();

    const task = await manager.runTask({
      prompt: "Build a login page",
      provider,
      model: "gpt-5",
      providerName: "openai",
      projectType: "react",
      projectContext: { path: tmpDir },
    });

    expect(task.status).toBe("completed");
    expect(task.response).toBe("Mocked response");
    const fetched = repo.findById(task.id);
    expect(fetched?.status).toBe("completed");
  });

  it("pending -> running -> failed on provider error", async () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const provider = mockProvider({
      sendTask: vi.fn().mockRejectedValue(new Error("Provider failed")),
    });

    await expect(
      manager.runTask({
        prompt: "fail test",
        provider,
        model: "gpt-5",
        providerName: "openai",
      }),
    ).rejects.toThrow("Provider failed");

    const tasks = repo.list();
    expect(tasks.length).toBe(1);
    expect(tasks[0].status).toBe("failed");
    expect(tasks[0].error).toContain("Provider failed");
  });

  it("persists response", async () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const provider = mockProvider({ sendTask: vi.fn().mockResolvedValue({ content: "Hello World", model: "gpt-5" }) });
    const task = await manager.runTask({
      prompt: "say hello",
      provider,
      model: "gpt-5",
      providerName: "openai",
    });
    expect(repo.findById(task.id)?.response).toBe("Hello World");
  });

  it("persists error", async () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const provider = mockProvider({ sendTask: vi.fn().mockRejectedValue(new Error("network error")) });
    try {
      await manager.runTask({ prompt: "oops", provider, model: "gpt-5", providerName: "openai" });
    } catch {}
    const task = repo.list()[0];
    expect(task.error).toBe("network error");
    expect(task.status).toBe("failed");
  });

  it("creates task with valid id format", () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const task = manager.createTask({ prompt: "test", provider: "openai", model: "gpt-5" });
    expect(task.id).toMatch(/^tsk_[a-f0-9]{10}$/);
  });

  it("throws on empty prompt", async () => {
    const db = getDatabase(dbPath);
    const repo = new TaskRepository(db);
    const manager = new TaskManager(repo);
    const provider = mockProvider();
    await expect(manager.runTask({ prompt: "   ", provider, model: "gpt-5", providerName: "openai" })).rejects.toThrow();
  });
});
