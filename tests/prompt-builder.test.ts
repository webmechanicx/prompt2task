import { describe, it, expect } from "vitest";
import { buildStructuredPrompt } from "../src/tasks/prompt-builder.js";

describe("prompt-builder", () => {
  it("transforms basic prompt", () => {
    const result = buildStructuredPrompt({ prompt: "make login page better" });
    expect(result).toContain('make login page better');
    expect(result).toContain("You are an expert software development agent");
    expect(result).toContain("Your task:");
    expect(result).toContain("Return:");
  });

  it("includes project type", () => {
    const result = buildStructuredPrompt({ prompt: "build dashboard", projectType: "React" });
    expect(result).toContain("Project type:");
    expect(result).toContain("React");
  });

  it("includes project context", () => {
    const result = buildStructuredPrompt({
      prompt: "fix bug",
      projectContext: { path: "/my/project", type: "react", framework: "React", language: "javascript" },
    });
    expect(result).toContain("/my/project");
    expect(result).toContain("React");
    expect(result).toContain("javascript");
  });

  it("handles missing project context", () => {
    const result = buildStructuredPrompt({ prompt: "hello" });
    expect(result).toContain("Project context");
  });

  it("includes detected type when present and generic otherwise", () => {
    const withType = buildStructuredPrompt({
      prompt: "test",
      projectContext: { path: "/tmp", type: "laravel" },
    });
    expect(withType).toContain("laravel");

    const withoutType = buildStructuredPrompt({
      prompt: "test",
      projectContext: { path: "/tmp" },
    });
    expect(withoutType).toContain("generic project");
  });
});
