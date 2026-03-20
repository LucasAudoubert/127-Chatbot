import { chatWithOpenRouter } from "@/server/openRouter";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 },
      );
    }

    const selectedModel = model || "nvidia/nemotron-3-super-120b-a12b:free";

    const response = await chatWithOpenRouter(messages, selectedModel);

    return NextResponse.json({
      content: response,
      success: true,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      {
        error: "Failed to get response from OpenRouter",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
