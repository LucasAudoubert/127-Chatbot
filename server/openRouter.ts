const openRouterKey =
  process.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

if (!openRouterKey) {
  console.error("OpenRouter API key not found in environment variables");
}

export const openRouterHeaders = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${openRouterKey}`,
};

interface OpenRouterMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithOpenRouter(
  messages: OpenRouterMessage[],
  model: string = "nvidia/nemotron-3-super-120b-a12b:free",
) {
  if (!openRouterKey) {
    throw new Error(
      "OpenRouter API key is not configured. Please check your environment variables.",
    );
  }

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.7,
        top_p: 1,
        top_k: 0,
        frequency_penalty: 0,
        presence_penalty: 0,
        repetition_penalty: 1,
        min_p: 0,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.json();
    console.error("OpenRouter API error:", error);
    throw new Error(
      `OpenRouter API error: ${error.error?.message || JSON.stringify(error)}`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
