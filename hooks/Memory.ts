import { useState, useEffect } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "chatbot_conversations";

export function useConversationMemory() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setConversations(parsed);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      }
      setIsLoaded(true);
    };

    if (typeof window !== "undefined") {
      loadConversations();
    }
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
      } catch (error) {
        console.error("Failed to save conversations:", error);
      }
    }
  }, [conversations, isLoaded]);

  const createConversation = (): string => {
    const id = Date.now().toString();
    const newConversation: Conversation = {
      id,
      title: "New Conversation",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(id);
    return id;
  };

  const updateConversationMessages = (
    conversationId: string,
    messages: Message[],
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              messages,
              updatedAt: Date.now(),
              // Update title based on first user message
              title:
                conv.title === "New Conversation" && messages.length > 0
                  ? messages
                      .find((m) => m.role === "user")
                      ?.content.substring(0, 50)
                      .trim() || "New Conversation"
                  : conv.title,
            }
          : conv,
      ),
    );
  };

  const deleteConversation = (conversationId: string) => {
    setConversations((prev) =>
      prev.filter((conv) => conv.id !== conversationId),
    );
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  };

  const getCurrentConversation = (): Conversation | undefined => {
    return conversations.find((conv) => conv.id === currentConversationId);
  };

  const getRecentConversations = (limit: number = 10): Conversation[] => {
    return conversations
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  };

  return {
    conversations,
    currentConversationId,
    isLoaded,
    createConversation,
    updateConversationMessages,
    deleteConversation,
    setCurrentConversationId,
    getCurrentConversation,
    getRecentConversations,
  };
}
