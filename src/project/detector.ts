import fs from "node:fs";
import path from "node:path";
import type { ProjectContext } from "./context.js";

function fileExists(dir: string, file: string): boolean {
  return fs.existsSync(path.join(dir, file));
}

function readJsonIfExists(dir: string, file: string): Record<string, unknown> | null {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) return null;
  try {
    const raw = fs.readFileSync(full, "utf-8");
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function detectProject(cwd: string = process.cwd()): ProjectContext {
  const context: ProjectContext = { path: cwd };

  // WordPress detection (highest priority for PHP WP)
  if (fileExists(cwd, "wp-config.php") || fileExists(cwd, "wp-load.php")) {
    context.type = "wordpress";
    context.framework = "WordPress";
    context.language = "php";
    return context;
  }

  // Laravel detection
  if (fileExists(cwd, "artisan")) {
    const composer = readJsonIfExists(cwd, "composer.json");
    const isLaravel =
      composer &&
      JSON.stringify(composer).toLowerCase().includes("laravel/framework");
    if (isLaravel || fileExists(cwd, "composer.json")) {
      context.type = "laravel";
      context.framework = "Laravel";
      context.language = "php";
      return context;
    }
  }

  // Composer generic PHP
  if (fileExists(cwd, "composer.json")) {
    context.type = "php";
    context.language = "php";
    return context;
  }

  // Node ecosystem
  const pkg = readJsonIfExists(cwd, "package.json");
  if (pkg) {
    const deps = {
      ...((pkg.dependencies as Record<string, string>) ?? {}),
      ...((pkg.devDependencies as Record<string, string>) ?? {}),
    };
    const depKeys = Object.keys(deps);

    // React detection: must have react in deps
    if (depKeys.includes("react")) {
      context.type = "react";
      context.framework = "React";
      context.language = "javascript";
      return context;
    }

    // Next.js also implies React but keep distinct framework
    if (depKeys.includes("next")) {
      context.type = "react";
      context.framework = "Next.js";
      context.language = "javascript";
      return context;
    }

    // Vue
    if (depKeys.includes("vue")) {
      context.type = "web-applications";
      context.framework = "Vue";
      context.language = "javascript";
      return context;
    }

    // Angular
    if (depKeys.includes("@angular/core")) {
      context.type = "web-applications";
      context.framework = "Angular";
      context.language = "javascript";
      return context;
    }

    // Generic Node
    context.type = "web-applications";
    context.framework = "Node.js";
    context.language = "javascript";
    return context;
  }

  // Unknown
  return context;
}
