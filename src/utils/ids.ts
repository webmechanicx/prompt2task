import { randomBytes } from "node:crypto";

export function generateTaskId(): string {
  // 5 random bytes -> 10 hex chars, prefixed with tsk_
  const hex = randomBytes(5).toString("hex");
  return `tsk_${hex}`;
}
