import fs from "node:fs";
import { getCredentialsPath, getAppDir } from "../utils/paths.js";
import { CredentialError } from "../utils/errors.js";

type CredentialsFile = Record<string, string>;

const ENV_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
};

function ensureCredentialsFile(): CredentialsFile {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(credPath, "utf-8");
    if (!raw.trim()) return {};
    return JSON.parse(raw) as CredentialsFile;
  } catch {
    throw new CredentialError(
      "Credentials file is corrupted.",
      "Try removing ~/.prompt2task/credentials.json and re-running `prompt2task provider`",
    );
  }
}

export function getCredential(provider: string): string | null {
  // Env var takes precedence for automation, but not persisted
  const envKey = ENV_MAP[provider];
  if (envKey && process.env[envKey]) {
    const val = process.env[envKey]!.trim();
    if (val) return val;
  }

  const file = ensureCredentialsFile();
  const key = file[provider];
  if (key && typeof key === "string" && key.trim()) return key.trim();
  return null;
}

export function saveCredential(provider: string, apiKey: string): void {
  if (!apiKey || !apiKey.trim()) {
    throw new CredentialError("API key cannot be empty.");
  }
  const dir = getAppDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const credPath = getCredentialsPath();
  const existing = ensureCredentialsFile();
  existing[provider] = apiKey.trim();

  fs.writeFileSync(credPath, JSON.stringify(existing, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(credPath, 0o600);
  } catch {
    // ignore
  }
  // ensure dir restrictive
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // ignore
  }
}

export function removeCredential(provider: string): boolean {
  const credPath = getCredentialsPath();
  if (!fs.existsSync(credPath)) return false;
  const existing = ensureCredentialsFile();
  if (!(provider in existing)) return false;
  delete existing[provider];
  fs.writeFileSync(credPath, JSON.stringify(existing, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(credPath, 0o600);
  } catch {
    // ignore
  }
  return true;
}

export function removeAllCredentials(): void {
  const credPath = getCredentialsPath();
  if (fs.existsSync(credPath)) {
    fs.unlinkSync(credPath);
  }
}

export function hasCredential(provider: string): boolean {
  return getCredential(provider) !== null;
}

export function listCredentialProviders(): string[] {
  const file = ensureCredentialsFile();
  return Object.keys(file);
}

/** Redact key for display: show last 4 chars */
export function redactApiKey(key: string): string {
  if (!key) return "****";
  if (key.length <= 8) return "****";
  return `${"*".repeat(Math.min(16, key.length - 4))}${key.slice(-4)}`;
}
