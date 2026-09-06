import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getAppDir, getConfigPath } from "../utils/paths.js";
import { ConfigError } from "../utils/errors.js";

export const configSchema = z.object({
  version: z.number().default(1),
  provider: z.enum(["openai", "claude"]),
  model: z.string().min(1),
  projectType: z.string().min(1),
});

export type AppConfig = z.infer<typeof configSchema>;

export const PROVIDER_MODELS: Record<string, string[]> = {
  openai: ["gpt-5", "gpt-5-mini", "gpt-4o", "gpt-4o-mini", "o1", "o1-mini"],
  claude: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
};

export const PROJECT_TYPES = [
  { value: "web-applications", label: "Web applications" },
  { value: "wordpress", label: "WordPress" },
  { value: "laravel", label: "Laravel" },
  { value: "react", label: "React" },
  { value: "other", label: "Other" },
] as const;

export function ensureAppDir(): void {
  const dir = getAppDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // ensure restrictive permissions on app dir (0700)
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // ignore on platforms where chmod not supported
  }
  const logsDir = path.join(dir, "logs");
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

export function configExists(): boolean {
  return fs.existsSync(getConfigPath());
}

export function loadConfig(): AppConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    throw new ConfigError(
      "Configuration not found. Run `prompt2task init` to set up.",
      "Run: prompt2task init",
    );
  }
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    return configSchema.parse(parsed);
  } catch (err) {
    if (err instanceof z.ZodError) {
      throw new ConfigError(
        `Invalid configuration: ${err.errors.map((e) => e.message).join(", ")}`,
        "Run `prompt2task init` to reconfigure or fix ~/.prompt2task/config.json",
      );
    }
    if (err instanceof ConfigError) throw err;
    throw new ConfigError(
      `Failed to load configuration: ${(err as Error).message}`,
      "Check ~/.prompt2task/config.json is valid JSON",
    );
  }
}

export function saveConfig(config: AppConfig): void {
  ensureAppDir();
  const parsed = configSchema.parse(config);
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(configPath, 0o600);
  } catch {
    // ignore
  }
}

export function getConfigOrNull(): AppConfig | null {
  try {
    return loadConfig();
  } catch {
    return null;
  }
}
