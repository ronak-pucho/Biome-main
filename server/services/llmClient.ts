export type LlmJsonResult<T> = {
  data: T;
  rawText?: string;
};

export interface LlmClient {
  completeJson<T>(input: {
    system: string;
    user: string;
    schemaHint?: string;
  }): Promise<LlmJsonResult<T>>;
}

export class StubLlmClient implements LlmClient {
  async completeJson<T>(input: { system: string; user: string }): Promise<LlmJsonResult<T>> {
    return { data: { system: input.system, user: input.user } as unknown as T };
  }
}

export class OpenAiCompatibleClient implements LlmClient {
  constructor(
    private config: {
      baseUrl: string;
      apiKey: string;
      model: string;
    }
  ) {}

  async completeJson<T>(input: {
    system: string;
    user: string;
    schemaHint?: string;
  }): Promise<LlmJsonResult<T>> {
    const url = new URL("/v1/chat/completions", this.config.baseUrl).toString();
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: input.system },
          { role: "user", content: input.user },
        ],
      }),
    });

    if (!resp.ok) {
      throw new Error(`LLM_REQUEST_FAILED_${resp.status}`);
    }

    const json = (await resp.json()) as any;
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.length === 0) {
      throw new Error("LLM_EMPTY_RESPONSE");
    }

    const parsed = JSON.parse(content) as T;
    return { data: parsed, rawText: content };
  }
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL;
  const model = process.env.LLM_MODEL;

  if (apiKey && baseUrl && model) {
    return new OpenAiCompatibleClient({ apiKey, baseUrl, model });
  }
  return new StubLlmClient();
}

