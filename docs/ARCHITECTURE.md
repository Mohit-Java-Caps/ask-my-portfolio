# Architecture

## Request flow

```
┌──────────────┐     POST /api/chat        ┌────────────────────────┐
│  React UI    │ ────  { message }  ─────▶ │  Vercel serverless fn  │
│ (ChatWidget) │                           │      api/chat.js       │
└──────────────┘                           └───────────┬────────────┘
       ▲                                                │
       │                                    1. Validate input
       │                                       (non-empty, ≤500 chars)
       │                                                │
       │                                    2. retrieve(message, corpus, 4)
       │                                       lib/retrieval.js — TF-IDF
       │                                       cosine similarity, top-4 chunks
       │                                                │
       │                                    3. GROQ_API_KEY set?
       │                                       ┌────────┴────────┐
       │                                      no                yes
       │                                       │                 │
       │                          return top chunk    buildUserPrompt(message, chunks)
       │                          as "extractive"       lib/prompt.js
       │                          answer directly                │
       │                                       │      call Groq chat completions
       │                                       │      (openai/gpt-oss-20b)
       │                                       │                 │
       │                                       └────────┬────────┘
       │                                                │
       │◀────  { answer, sources[], mode }  ─────────────┘
       │
  render message + source-category tags in the UI
```

## Decision tree: how a question gets answered

```
Is the question about Mohit's real, documented experience/logistics?
├─ Yes, and it matches a corpus chunk well (cosine similarity > 0)
│    → retrieved chunk(s) become context
│    → Groq generates a grounded answer (or, in demo mode, the chunk is
│      returned directly)
│
└─ No relevant chunk found (similarity 0 for everything)
     → sources array is empty
     → the system prompt instructs the model to say it doesn't have that
       detail and point to mohitlogin72@gmail.com — it is explicitly told
       NOT to guess
```

This is the core anti-hallucination mechanism: the system prompt (`lib/prompt.js`) restricts the model to the retrieved context only, and the empty-context case is handled explicitly rather than left to the model's judgment.

## Why a serverless function instead of a full backend

- No server to provision, patch, or pay for when idle.
- Vercel's free tier is generous enough for a portfolio demo's traffic.
- The API key never reaches the browser — it lives only in the function's environment, set via Vercel's dashboard (or a local, gitignored `.env`).

## Why Groq instead of OpenAI/Anthropic/Bedrock

- Free tier with no credit card required, which matters for a project meant to be forked and run by anyone.
- Fast inference (relevant for a chat UI — latency is felt immediately).
- AWS Bedrock was considered (it matches Mohit's resume stack more closely), but requires enabling model access in an AWS account first — more setup friction for a project whose whole point is "clone and run."

## Known limitations (stated deliberately, not hidden)

- **TF-IDF retrieval is lexical, not semantic.** It matches on shared words/roots, not meaning. A question phrased very differently from the corpus wording may retrieve a weaker match. This is a reasonable trade-off at ~25 chunks; it would need to become an embedding-based retriever if the corpus grew into the hundreds.
- **The corpus is static.** It's rebuilt by hand from the portfolio's verified data, not synced automatically. A production version would generate `lib/corpus.js` from a single shared source of truth.
- **No conversation memory.** Each question is answered independently; there's no multi-turn context carried between messages. This was a deliberate scope cut, not an oversight — see `docs/INTERVIEW_PREP.md` for how to talk about it as a "next step."
