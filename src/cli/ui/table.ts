import Table from "cli-table3";
import type { Task } from "../../tasks/task.js";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

export function renderTaskTable(tasks: Task[]): string {
  const table = new Table({
    head: ["TASK ID", "STATUS", "CREATED", "PROMPT"],
    colWidths: [14, 12, 18, 40],
    wordWrap: true,
    style: { head: [], border: [] },
  });

  for (const t of tasks) {
    table.push([t.id, t.status, formatDate(t.createdAt), truncate(t.prompt, 38)]);
  }

  return table.toString();
}
