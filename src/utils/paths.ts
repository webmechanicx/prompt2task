import os from "node:os";
import path from "node:path";

export function getAppDir(): string {
  return path.join(os.homedir(), ".prompt2task");
}

export function getConfigPath(): string {
  return path.join(getAppDir(), "config.json");
}

export function getDbPath(): string {
  return path.join(getAppDir(), "history.db");
}

export function getLogsDir(): string {
  return path.join(getAppDir(), "logs");
}

export function getCredentialsPath(): string {
  return path.join(getAppDir(), "credentials.json");
}
