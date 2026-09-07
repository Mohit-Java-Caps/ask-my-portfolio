import React, { useEffect, useRef, useState } from "react";

const STARTER_QUESTIONS = [
  "What did Mohit build at NextEra Energy?",
  "Does he have AWS experience?",
  "What's his notice period?",
  "Is he open to contract roles?",
  "What kind of role is he looking for next?",
];

const API_URL = import.meta.env.VITE_API_URL || "/api/chat";

const Message = ({ role, text, sources, mode, error }) => {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        isUser
          ? "bg-primary text-primary-foreground"
          : error
            ? "border border-red-500/30 bg-red-500/10 text-red-200"
            : "border border-border bg-card text-foreground"
      }`}
      >
        <p>{text}</p>
        {!isUser && !error && sources?.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-2">
            {sources.map((s) => (
              <span
                key={s.id}
                title={`similarity ${s.score}`}
                className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted"
              >
                {s.category}
              </span>
            ))}
            {mode === "extractive" && (
              <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-primary">
                demo mode
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex justify-start">
    <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-card px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  </div>
);

const ChatWidget = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async (text) => {
    const question = text.trim();
    if (!question || loading) return;

    // Prior turns give the model conversational memory across follow-ups;
    // retrieval itself still runs fresh against the latest question only.
    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setMessages((m) => [...m, { role: "bot", text: data.answer, sources: data.sources, mode: data.mode }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: err.message || "Network error — try again.", error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="mx-auto flex h-[640px] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card/60">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-mono text-sm font-bold text-primary-foreground">
          MK
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-foreground">Ask My Portfolio</p>
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
            RAG assistant · grounded in Mohit's real experience
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Ask about Mohit's experience, stack, availability, or projects — try one of these:
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full border border-border px-3 py-1.5 text-left text-xs text-foreground/90 transition hover:border-primary/50 hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => <Message key={i} {...m} />)}
        {loading && <TypingIndicator />}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Mohit..."
          maxLength={500}
          className="h-11 flex-1 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted focus:border-primary/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
