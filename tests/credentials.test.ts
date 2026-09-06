import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { mkdtempSync, rmSync } from "node:fs";

let tmpHome: string;
let originalHome: string | undefined;
let originalOpenAI: string | undefined;
let originalClaude: string | undefined;

beforeEach(() => {
  originalHome = process.env.HOME;
  originalOpenAI = process.env.OPENAI_API_KEY;
  originalClaude = process.env.ANTHROPIC_API_KEY;
  tmpHome = mkdtempSync(path.join(os.tmpdir(), "p2t-cred-"));
  process.env.HOME = tmpHome;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

afterEach(() => {
  if (originalHome !== undefined) process.env.HOME = originalHome;
  else delete process.env.HOME;
  if (originalOpenAI !== undefined) process.env.OPENAI_API_KEY = originalOpenAI;
  else delete process.env.OPENAI_API_KEY;
  if (originalClaude !== undefined) process.env.ANTHROPIC_API_KEY = originalClaude;
  else delete process.env.ANTHROPIC_API_KEY;
  try {
    rmSync(tmpHome, { recursive: true, force: true });
  } catch {}
});

describe("credentials", () => {
  it("saves and retrieves credential", async () => {
    const { saveCredential, getCredential } = await import("../src/config/credentials.js");
    saveCredential("openai", "sk-test123456789");
    expect(getCredential("openai")).toBe("sk-test123456789");
  });

  it("returns null when missing", async () => {
    const { getCredential } = await import("../src/config/credentials.js");
    expect(getCredential("openai")).toBeNull();
  });

  it("prefers env var over file", async () => {
    const { saveCredential, getCredential } = await import("../src/config/credentials.js");
    saveCredential("openai", "sk-file-key");
    process.env.OPENAI_API_KEY = "sk-env-key";
    expect(getCredential("openai")).toBe("sk-env-key");
  });

  it("deletes credential", async () => {
    const { saveCredential, removeCredential, getCredential } = await import("../src/config/credentials.js");
    saveCredential("claude", "sk-ant-test");
    expect(getCredential("claude")).toBe("sk-ant-test");
    const removed = removeCredential("claude");
    expect(removed).toBe(true);
    expect(getCredential("claude")).toBeNull();
  });

  it("removeAll deletes file", async () => {
    const { saveCredential, removeAllCredentials, getCredential } = await import("../src/config/credentials.js");
    saveCredential("openai", "sk-123");
    saveCredential("claude", "sk-ant-123");
    removeAllCredentials();
    expect(getCredential("openai")).toBeNull();
    expect(getCredential("claude")).toBeNull();
  });

  it("redacts api key", async () => {
    const { redactApiKey } = await import("../src/config/credentials.js");
    const key = "sk-proj-1234567890abcdef";
    const redacted = redactApiKey(key);
    expect(redacted).not.toContain("1234567890");
    expect(redacted.endsWith("cdef")).toBe(true);
    expect(redacted).toContain("*");
  });

  it("throws on empty key", async () => {
    const { saveCredential } = await import("../src/config/credentials.js");
    expect(() => saveCredential("openai", "   ")).toThrow();
  });

  it("hasCredential reflects env var", async () => {
    const { hasCredential } = await import("../src/config/credentials.js");
    expect(hasCredential("openai")).toBe(false);
    process.env.OPENAI_API_KEY = "sk-env";
    expect(hasCredential("openai")).toBe(true);
  });
});
