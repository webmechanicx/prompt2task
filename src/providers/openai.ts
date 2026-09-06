import type { AIProvider, AIResponse, ProviderTask } from "./provider.js";
import { ProviderError } from "../utils/errors.js";
import { getCredential } from "../config/credentials.js";

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";

  constructor(private readonly apiKey?: string) {}

  private getApiKey(): string {
    const key = this.apiKey ?? getCredential("openai");
    if (!key) {
      throw new ProviderError(
        "Missing OpenAI API key.",
        "Set OPENAI_API_KEY env var or run `prompt2task provider`",
      );
    }
    return key;
  }

  async validateCredentials(): Promise<boolean> {
    const key = this.getApiKey();
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${key}` },
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
      messages: [{ role: "user", content: task.structuredPrompt }],
    };

    let res: Response;
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ProviderError(
        `Unable to connect to OpenAI: ${(err as Error).message}`,
        "Check your network connection",
      );
    }

    if (res.status === 401) {
      throw new ProviderError(
        "OpenAI authentication failed. Invalid API key.",
        "Check your API key with: prompt2task provider",
      );
    }
    if (res.status === 429) {
      throw new ProviderError(
        "OpenAI rate limit exceeded. Please try again later.",
        "Wait a moment and retry",
      );
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new ProviderError(
        `OpenAI request failed (${res.status}): ${text.slice(0, 500)}`,
      );
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content) {
      throw new ProviderError("OpenAI returned an empty response.");
    }

    return {
      content,
      model: data.model ?? task.model,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }
}
