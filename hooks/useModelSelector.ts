import { useState, useEffect } from "react";

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

// Popular free and affordable models from OpenRouter
export const AVAILABLE_MODELS: AIModel[] = [
  {
    id: "openai/gpt-4-turbo-preview",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
    provider: "OpenAI",
  },
  {
    id: "nvidia/nemotron-3-super-120b-a12b:free",
    name: "NVIDIA Nemotron 3 (Free)",
    provider: "NVIDIA",
  },
  {
    id: "meta-llama/llama-2-70b-chat",
    name: "Llama 2 70B",
    provider: "Meta",
  },
  {
    id: "mistralai/mistral-7b-instruct:free",
    name: "Mistral 7B (Free)",
    provider: "Mistral",
  },
  {
    id: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash (Free)",
    provider: "Google",
  },
];

const MODEL_STORAGE_KEY = "chatbot_selected_model";

export function useModelSelector() {
  const [selectedModel, setSelectedModel] = useState<string>(
    AVAILABLE_MODELS[0].id,
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load selected model from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(MODEL_STORAGE_KEY);
        if (stored && AVAILABLE_MODELS.some((m) => m.id === stored)) {
          setSelectedModel(stored);
        } else {
          setSelectedModel(AVAILABLE_MODELS[0].id);
        }
      } catch (error) {
        console.error("Failed to load model selection:", error);
      }
      setIsLoaded(true);
    }
  }, []);

  // Save selected model to localStorage
  const selectModel = (modelId: string) => {
    setSelectedModel(modelId);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(MODEL_STORAGE_KEY, modelId);
      } catch (error) {
        console.error("Failed to save model selection:", error);
      }
    }
  };

  const getCurrentModel = () => {
    return AVAILABLE_MODELS.find((m) => m.id === selectedModel);
  };

  return {
    selectedModel,
    isLoaded,
    selectModel,
    getCurrentModel,
    availableModels: AVAILABLE_MODELS,
  };
}