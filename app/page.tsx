"use client";

import { useState, useRef, useEffect } from "react";
import { gsap } from "gsap";
import ReactMarkdown from "react-markdown";
import { useConversationMemory } from "@/hooks/Memory";
import { useModelSelector } from "@/hooks/useModelSelector";
import {
  Send,
  Sparkles,
  User,
  Loader2,
  Menu,
  Plus,
  Settings,
  Moon,
  Sun,
  Trash2,
  Image,
  X,
  ChevronDown,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const suggestedPrompts = [
  "Explain quantum computing",
  "Write a haiku about AI",
  "Help me brainstorm ideas",
  "Summarize the latest tech trends",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showModelMenu, setShowModelMenu] = useState(false);

  const {
    currentConversationId,
    isLoaded,
    createConversation,
    updateConversationMessages,
    deleteConversation,
    setCurrentConversationId,
    getCurrentConversation,
    getRecentConversations,
  } = useConversationMemory();

  const { selectedModel, selectModel, getCurrentModel, availableModels } =
    useModelSelector();

  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const promptsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  // Initialize conversation on load
  useEffect(() => {
    if (!isLoaded) return;

    const currentConv = getCurrentConversation();
    if (currentConv) {
      setMessages(currentConv.messages);
    } else if (currentConversationId === null) {
      // Auto-create first conversation
      createConversation();
    }
  }, [isLoaded, currentConversationId]);

  // Save messages to conversation
  useEffect(() => {
    if (currentConversationId && isLoaded) {
      updateConversationMessages(currentConversationId, messages);
    }
  }, [messages, currentConversationId, isLoaded]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Logo animation
      gsap.fromTo(
        logoRef.current,
        { scale: 0, rotation: -180, opacity: 0 },
        {
          scale: 1,
          rotation: 0,
          opacity: 1,
          duration: 1.2,
          ease: "elastic.out(1, 0.5)",
        },
      );

      // Hero text animation
      gsap.fromTo(
        ".hero-title",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: "power3.out" },
      );

      gsap.fromTo(
        ".hero-subtitle",
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.5, ease: "power3.out" },
      );

      // Suggested prompts animation
      gsap.fromTo(
        ".prompt-card",
        { y: 30, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          delay: 0.7,
          ease: "power3.out",
        },
      );

      // Input animation
      gsap.fromTo(
        ".input-container",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.9, ease: "power3.out" },
      );

      // Floating animation for logo
      gsap.to(logoRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages.length]);

  const animateNewMessage = (messageEl: HTMLElement) => {
    gsap.fromTo(
      messageEl,
      { y: 20, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
    );
  };

  const hideHero = () => {
    if (heroRef.current && messages.length === 0) {
      gsap.to(heroRef.current, {
        opacity: 0,
        y: -50,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          if (heroRef.current) {
            heroRef.current.style.display = "none";
          }
        },
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedImages((prev) => [...prev, event.target.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    hideHero();

    let messageContent = input.trim();
    if (uploadedImages.length > 0) {
      messageContent += `\n\n[Images attached: ${uploadedImages.length}]`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setUploadedImages([]);
    setIsLoading(true);

    try {
      // Call the API route with all messages and selected model
      const allMessages = [...messages, userMessage];

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: allMessages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from AI");
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I couldn't get a response. Please check your API configuration and try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex flex-col h-full p-4">
          <button
            className="flex items-center gap-3 w-full p-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 group"
            onClick={() => {
              const newConvId = createConversation();
              setMessages([]);
              if (heroRef.current) {
                heroRef.current.style.display = "flex";
                gsap.to(heroRef.current, { opacity: 1, y: 0, duration: 0.5 });
              }
            }}
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium">New Chat</span>
          </button>

          <div className="mt-6 flex-1 overflow-auto">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Recent
            </p>
            <div className="space-y-1">
              {getRecentConversations(10).map((conv) => (
                <div key={conv.id} className="group flex items-center gap-2">
                  <button
                    onClick={() => {
                      setCurrentConversationId(conv.id);
                      if (heroRef.current) {
                        heroRef.current.style.display = "none";
                      }
                    }}
                    className={`flex-1 text-left p-3 rounded-lg text-sm transition-colors duration-200 truncate ${
                      currentConversationId === conv.id
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-foreground/80 hover:bg-secondary"
                    }`}
                  >
                    {conv.title}
                  </button>
                  <button
                    onClick={() => deleteConversation(conv.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/20 transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border pt-4 space-y-2">
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center justify-between gap-3 w-full p-3 rounded-lg text-foreground/80 hover:bg-secondary transition-colors duration-200"
              >
                <div className="flex items-center gap-2 flex-1">
                  <Settings className="w-5 h-5" />
                  <div className="text-left">
                    <span className="text-xs text-muted-foreground block">
                      Model
                    </span>
                    <span className="text-sm font-medium truncate">
                      {getCurrentModel()?.name || "Select model"}
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showModelMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showModelMenu && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        selectModel(model.id);
                        setShowModelMenu(false);
                      }}
                      className={`flex flex-col w-full text-left px-4 py-3 border-b border-border/50 last:border-b-0 hover:bg-secondary transition-colors ${
                        selectedModel === model.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-foreground">
                        {model.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {model.provider}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className="flex items-center gap-3 w-full p-3 rounded-lg text-foreground/80 hover:bg-secondary transition-colors duration-200"
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
              <span className="text-sm">
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-border bg-background/80 backdrop-blur-xl">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg text-foreground">127</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-scroll px-4 py-6">
          {/* Hero Section */}
          <div
            ref={heroRef}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            style={{ display: messages.length > 0 ? "none" : "flex" }}
          >
            <div ref={logoRef} className="relative mb-8">
              <div className="w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30">
                <Sparkles className="w-12 h-12 text-primary-foreground" />
              </div>
              <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-2xl -z-10" />
            </div>

            <h1 className="hero-title text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Hello, I&apos;m <span className="text-primary">127</span>
            </h1>
            <p className="hero-subtitle text-lg text-muted-foreground max-w-md text-pretty">
              Your intelligent AI assistant. Ask me anything, and let&apos;s
              explore ideas together.
            </p>

            <div
              ref={promptsRef}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full max-w-2xl"
            >
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handlePromptClick(prompt)}
                  className="prompt-card p-4 text-left rounded-2xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 group"
                >
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                ref={(el) => {
                  if (el && index === messages.length - 1) {
                    animateNewMessage(el);
                  }
                }}
                className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                    <img
                      src="/stars.svg"
                      alt="Assistant"
                      className="w-5 h-5 text-primary-foreground"
                      style={{ filter: "brightness(0) invert(1)" }}
                    />
                  </div>
                )}
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl border border-primary/40 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-transparent text-foreground rounded-bl-md"
                  }`}
                >
                  <div className="text-sm leading-relaxed max-w-none space-y-2">
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => (
                          <h1
                            className="text-2xl font-extrabold mt-5 mb-3 text-primary"
                            {...props}
                          />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2
                            className="text-xl font-bold mt-4 mb-2 text-primary"
                            {...props}
                          />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3
                            className="text-lg font-bold mt-3 mb-2 text-primary/90"
                            {...props}
                          />
                        ),
                        h4: ({ node, ...props }) => (
                          <h4
                            className="text-base font-bold mt-2 mb-1"
                            {...props}
                          />
                        ),
                        h5: ({ node, ...props }) => (
                          <h5
                            className="text-base font-semibold mt-2 mb-1"
                            {...props}
                          />
                        ),
                        h6: ({ node, ...props }) => (
                          <h6
                            className="text-sm font-semibold mt-2 mb-1"
                            {...props}
                          />
                        ),
                        p: ({ node, ...props }) => (
                          <p
                            className="my-2 text-base leading-relaxed"
                            {...props}
                          />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul
                            className="list-disc list-outside ml-5 my-3 space-y-1.5"
                            {...props}
                          />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol
                            className="list-decimal list-outside ml-5 my-3 space-y-1.5"
                            {...props}
                          />
                        ),
                        li: ({ node, ...props }) => (
                          <li className="ml-2 text-base" {...props} />
                        ),
                        code: ({ node, inline, ...props }) =>
                          inline ? (
                            <code
                              className="bg-primary/10 px-2 py-1 rounded text-sm font-mono text-primary"
                              {...props}
                            />
                          ) : (
                            <code
                              className="block bg-primary/5 border border-primary/20 p-4 rounded-lg my-3 overflow-x-auto text-xs font-mono leading-relaxed"
                              {...props}
                            />
                          ),
                        pre: ({ node, ...props }) => (
                          <pre
                            className="bg-primary/5 border border-primary/20 p-4 rounded-lg my-3 overflow-x-auto"
                            {...props}
                          />
                        ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote
                            className="border-l-4 border-primary pl-4 py-1 italic my-3 bg-primary/5 rounded-r-lg"
                            {...props}
                          />
                        ),
                        strong: ({ node, ...props }) => (
                          <strong className="font-bold" {...props} />
                        ),
                        em: ({ node, ...props }) => (
                          <em className="italic" {...props} />
                        ),
                        hr: ({ node, ...props }) => (
                          <hr className="my-4 border-border" {...props} />
                        ),
                        table: ({ node, ...props }) => (
                          <table
                            className="border-collapse border border-border my-3"
                            {...props}
                          />
                        ),
                        th: ({ node, ...props }) => (
                          <th
                            className="border border-border p-2 bg-primary/10 font-bold"
                            {...props}
                          />
                        ),
                        td: ({ node, ...props }) => (
                          <td className="border border-border p-2" {...props} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4 justify-start">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                  <img
                    src="/stars.svg"
                    alt="Assistant"
                    className="w-5 h-5"
                    style={{ filter: "brightness(0) invert(1)" }}
                  />
                </div>
                <div className="px-5 py-4 rounded-2xl rounded-bl-md bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">
                      127 is thinking...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-background/80 backdrop-blur-xl">
          <form
            onSubmit={handleSubmit}
            className="input-container max-w-3xl mx-auto"
          >
            {/* Image Preview */}
            {uploadedImages.length > 0 && (
              <div className="mb-4 flex gap-2 flex-wrap">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={image}
                      alt={`Uploaded ${index}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:opacity-80 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="p-3 rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-colors duration-200 cursor-pointer"
              >
                <Image className="w-5 h-5" />
              </label>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message 127..."
                className="flex-1 px-5 py-4 rounded-2xl bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              127 may produce inaccurate information. Always verify important
              details.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
