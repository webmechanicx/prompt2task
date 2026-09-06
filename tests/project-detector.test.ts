import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { mkdtempSync, rmSync } from "node:fs";
import { detectProject } from "../src/project/detector.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "p2t-proj-"));
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe("project detector", () => {
  it("detects React project", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({ dependencies: { react: "^18.0.0" } }),
    );
    const ctx = detectProject(tmpDir);
    expect(ctx.type).toBe("react");
    expect(ctx.framework).toBe("React");
  });

  it("detects generic Node project as web-applications", () => {
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ dependencies: { express: "^4.0.0" } }));
    const ctx = detectProject(tmpDir);
    expect(ctx.type).toBe("web-applications");
    expect(ctx.framework).toBe("Node.js");
  });

  it("detects Laravel project", () => {
    fs.writeFileSync(path.join(tmpDir, "artisan"), "");
    fs.writeFileSync(path.join(tmpDir, "composer.json"), JSON.stringify({ require: { "laravel/framework": "^10.0" } }));
    const ctx = detectProject(tmpDir);
    expect(ctx.type).toBe("laravel");
    expect(ctx.framework).toBe("Laravel");
  });

  it("detects WordPress", () => {
    fs.writeFileSync(path.join(tmpDir, "wp-config.php"), "<?php");
    const ctx = detectProject(tmpDir);
    expect(ctx.type).toBe("wordpress");
    expect(ctx.framework).toBe("WordPress");
  });

  it("detects unknown project", () => {
    const ctx = detectProject(tmpDir);
    expect(ctx.path).toBe(tmpDir);
    expect(ctx.type).toBeUndefined();
  });

  it("detects Vue as web-applications", () => {
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ dependencies: { vue: "^3.0.0" } }));
    const ctx = detectProject(tmpDir);
    expect(ctx.type).toBe("web-applications");
    expect(ctx.framework).toBe("Vue");
  });

  it("detects Next.js as React", () => {
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ dependencies: { next: "^14.0.0", react: "^18" } }));
    const ctx = detectProject(tmpDir);
    // react takes precedence if present, else Next.js maps to react
    expect(ctx.type).toBe("react");
  });
});
