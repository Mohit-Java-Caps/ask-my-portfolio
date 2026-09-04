import React from "react";
import ChatWidget from "./components/ChatWidget";

function App() {
  return (
    <div className="min-h-screen bg-background px-5 py-16 text-foreground sm:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary">Ask My Portfolio</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          A RAG chatbot, trained on Mohit's real experience.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
          Ask about Mohit's projects, tech stack, or availability — every answer is grounded
          in his real, verified experience.
        </p>
      </div>
      <div className="mt-10">
        <ChatWidget />
      </div>
    </div>
  );
}

export default App;
