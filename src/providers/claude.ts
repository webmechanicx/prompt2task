import type { AIProvider, AIResponse, ProviderTask } from "./provider.js";
import { ProviderError } from "../utils/errors.js";
import { getCredential } from "../config/credentials.js";

export class ClaudeProvider implements AIProvider {
  readonly name = "claude";

  constructor(private readonly apiKey?: string) {}

  private getApiKey(): string {
    const key = this.apiKey ?? getCredential("claude");
    if (!key) {
      throw new ProviderError(
        "Missing Claude API key.",
        "Set ANTHROPIC_API_KEY env var or run `prompt2task provider`",
      );
    }
    return key;
  }

  async validateCredentials(): Promise<boolean> {
    const key = this.getApiKey();
    try {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async sendTask(task: ProviderTask): Promise<AIResponse> {
    const key = this.getApiKey();

    const body = {
      model: task.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: task.structuredPrompt }],
    };

    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ProviderError(
        `Unable to connect to Claude: ${(err as Error).message}`,
        "Check your network connection",
      );
    }

    if (res.status === 401) {
      throw new ProviderError(
        "Claude authentication failed. Invalid API key.",
        "Check your API key with: prompt2task provider",
      );
    }
    if (res.status === 429) {
      throw new ProviderError(
        "Claude rate limit exceeded. Please try again later.",
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(
        `Claude request failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
      model?: string;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    const textPart = data.content?.find((c) => c.type === "text");
    const content = textPart?.text ?? "";
    if (!content) {
      throw new ProviderError("Claude returned an empty response.");
    }

    return {
      content,
      model: data.model ?? task.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens:
              (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
          }
        : undefined,
    };
  }
}
