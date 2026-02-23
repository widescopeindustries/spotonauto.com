"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Zap } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
  link?: { href: string; label: string };
}

const GREETER_SEEN_KEY = "spotonauto_guide_seen";

export function SpotOnGuide() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! 👋 What year, make, and model is your car?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-open after 3 seconds on first visit only
  useEffect(() => {
    const seen = localStorage.getItem(GREETER_SEEN_KEY);
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 3000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) localStorage.setItem(GREETER_SEEN_KEY, "1");
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/greeter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], sessionId }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, link: data.link },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Having trouble connecting. Try searching from the top of the page!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 z-50 group flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-sm px-4 py-3 rounded-full shadow-lg shadow-cyan-500/30 transition-all hover:scale-105"
        aria-label="Open SpotOn Guide"
      >
        <Zap className="h-4 w-4" />
        <span className="hidden sm:inline">SpotOn Guide</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[480px] max-h-[calc(100vh-5rem)] bg-[#0d0d0d] border border-cyan-500/30 rounded-xl shadow-2xl shadow-cyan-500/10 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#111] border-b border-cyan-500/20 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <div className="font-semibold text-sm text-white font-display tracking-wide">SpotOn Guide</div>
            <div className="text-xs text-gray-500">AI Vehicle Assistant</div>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-white transition-colors rounded p-1 hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cyan-500 text-black font-medium rounded-br-sm"
                  : "bg-white/5 text-gray-200 border border-white/10 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
            {msg.link && (
              <a
                href={msg.link.href}
                className="mt-1.5 inline-flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              >
                🔧 {msg.link.label} →
              </a>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-xl rounded-bl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3 flex gap-2 bg-[#0d0d0d] flex-shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="e.g. 2018 Honda Civic"
          className="flex-1 text-sm bg-white/5 border border-white/10 text-gray-200 placeholder-gray-600 rounded-lg px-3 py-2 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-black rounded-lg px-3 py-2 transition-colors"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
