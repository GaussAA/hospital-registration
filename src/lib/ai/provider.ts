import type { ChatMessage, FunctionCallTool } from "./types";

/**
 * LLM Provider abstraction.
 * Currently supports DeepSeek, with easy extension to other OpenAI-compatible APIs.
 */

interface ProviderConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface CompletionRequest {
  messages: ChatMessage[];
  tools?: FunctionCallTool[];
  temperature?: number;
  maxTokens?: number;
}

interface CompletionResponse {
  content: string | null;
  toolCalls: Array<{
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

/* ── Configuration ── */

function getConfig(): ProviderConfig {
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || "";
  const baseUrl = process.env.AI_BASE_URL || "https://api.deepseek.com/v1";
  const model = process.env.AI_MODEL || "deepseek-v4-flash";

  return { apiKey, baseUrl, model };
}

/* ── DeepSeek / OpenAI-compatible Provider ── */

async function callOpenAICompatible(
  config: ProviderConfig,
  req: CompletionRequest
): Promise<CompletionResponse> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: req.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: req.tools,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const msg = choice?.message;

  return {
    content: msg?.content ?? null,
    toolCalls: (msg?.tool_calls || []).map((tc: { id: string; type: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      type: "function" as const,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    })),
  };
}

/* ── Vision (Image Analysis) Support ── */

interface VisionMessage {
  role: "user" | "assistant" | "system";
  content: Array<{
    type: "text" | "image_url";
    text?: string;
    image_url?: { url: string };
  }>;
}

interface VisionRequest {
  messages: VisionMessage[];
  temperature?: number;
  maxTokens?: number;
}

/**
 * Call DeepSeek Vision API with image analysis.
 * imageUrl can be a public URL or a base64 data URL.
 */
export async function visionCompletion(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const config = getConfig();

  if (!config.apiKey) {
    return "AI 视觉服务尚未配置 API 密钥，无法分析图片。";
  }

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Vision API error (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "无法分析该图片。";
  } catch (error: any) {
    console.error("[Vision API Error]", error);
    return `图片分析失败：${error.message}`;
  }
}

/* ── Public API ── */

export async function completion(req: CompletionRequest): Promise<CompletionResponse> {
  const config = getConfig();

  if (!config.apiKey) {
    // Return a mock response indicating the feature needs configuration
    return {
      content: null,
      toolCalls: [
        {
          id: "mock-no-api-key",
          type: "function",
          function: {
            name: "no_api_key_configured",
            arguments: "{}",
          },
        },
      ],
    };
  }

  return callOpenAICompatible(config, req);
}

/**
 * Check if the AI provider is configured.
 */
export function isProviderConfigured(): boolean {
  return !!(process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY);
}
