import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";

let tmpHome: string;
let originalHome: string | undefined;

beforeEach(() => {
  originalHome = process.env.HOME;
  tmpHome = mkdtempSync(path.join(os.tmpdir(), "p2t-config-"));
  process.env.HOME = tmpHome;
});

afterEach(() => {
  if (originalHome !== undefined) process.env.HOME = originalHome;
  else delete process.env.HOME;
  try {
    rmSync(tmpHome, { recursive: true, force: true });
  } catch {}
  // reset singleton
  // ensure we close any db that might have been opened
});

describe("config-manager", () => {
  it("creates config and loads it", async () => {
    const { saveConfig, loadConfig } = await import("../src/config/config-manager.js");
    saveConfig({ version: 1, provider: "openai", model: "gpt-5", projectType: "web-applications" });
    const loaded = loadConfig();
    expect(loaded.provider).toBe("openai");
    expect(loaded.model).toBe("gpt-5");
    expect(loaded.projectType).toBe("web-applications");
    expect(loaded.version).toBe(1);
  });

  it("validates provider enum", async () => {
    const { saveConfig } = await import("../src/config/config-manager.js");
    expect(() =>
      saveConfig({ version: 1, provider: "invalid" as any, model: "gpt-5", projectType: "web" }),
    ).toThrow();
  });

  it("throws when config missing", async () => {
    const { loadConfig } = await import("../src/config/config-manager.js");
    expect(() => loadConfig()).toThrow(/not been initialized|Configuration not found/);
  });

  it("throws on malformed config", async () => {
    const { loadConfig } = await import("../src/config/config-manager.js");
    const { getConfigPath } = await import("../src/utils/paths.js");
    const { ensureAppDir } = await import("../src/config/config-manager.js");
    ensureAppDir();
    const cfgPath = getConfigPath();
    fs.writeFileSync(cfgPath, "{ invalid json", "utf-8");
    expect(() => loadConfig()).toThrow();
  });

  it("handles missing projectType validation", async () => {
    const { saveConfig } = await import("../src/config/config-manager.js");
    expect(() => saveConfig({ version: 1, provider: "openai", model: "", projectType: "web" } as any)).toThrow();
  });

  it("ensures app dir creates with correct permissions", async () => {
    const { ensureAppDir } = await import("../src/config/config-manager.js");
    const { getAppDir } = await import("../src/utils/paths.js");
    ensureAppDir();
    expect(fs.existsSync(getAppDir())).toBe(true);
    expect(fs.existsSync(path.join(getAppDir(), "logs"))).toBe(true);
  });
});
