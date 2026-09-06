export let debugEnabled = false;

export function setDebug(enabled: boolean): void {
  debugEnabled = enabled;
}

export function debug(...args: unknown[]): void {
  if (debugEnabled) {
    console.error("[debug]", ...args);
  }
}
