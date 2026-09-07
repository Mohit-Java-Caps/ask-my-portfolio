# Architecture

## Request flow

```
┌──────────────┐  POST /api/chat                ┌────────────────────────┐
│  React UI    │ ── { message, history } ─────▶ │  Vercel serverless fn  │
│ (ChatWidget) │                                │      api/chat.js       │
└──────────────┘                                └───────────┬────────────┘
       ▲                                                     │
       │                                    1. Validate input, sanitize history
       │                                       (message ≤500 chars, history capped)
       │                                                     │
       │                                    2. HF_API_KEY set?
       │                                       ┌─────────────┴─────────────┐
       │                                      no                          yes
       │                                       │                           │
       │                          retrieve(message, corpus, 4)   retrieveSemantic(message, corpus, 4)
       │                          lib/retrieval.js — TF-IDF       lib/semanticRetrieval.js — Hugging Face
       │                          cosine similarity, top-4        sentence-similarity, top-4
       │                                       │                           │
       │                                       │              call fails? ─┘ falls back to TF-IDF
       │                                       └─────────────┬─────────────┘
       │                                                     │
       │                                    3. GROQ_API_KEY set?
       │                                       ┌─────────────┴─────────────┐
       │                                      no                          yes
       │                                       │                           │
       │                          return top chunk    messages = [system, ...history, buildUserPrompt(message, chunks)]
       │                          as "extractive"       lib/prompt.js
       │                          answer directly                         │
       │                                       │      call Groq chat completions
       │                                       │      (openai/gpt-oss-20b)
       │                                       │                           │
       │                                       └─────────────┬─────────────┘
       │                                                     │
       │◀────  { answer, sources[], mode, retrieval }  ───────┘
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

## Why Hugging Face's Inference API for semantic retrieval, instead of running the model in-process

`transformers.js` (an embedding model running directly inside the serverless function via ONNX Runtime) was considered, but a Vercel Node function is a poor place for it: the model weights would need to download on every cold start, and the ONNX runtime's native bindings add real bundle-size and cold-start risk on a platform with a function-size ceiling. Calling a hosted sentence-similarity endpoint keeps `api/chat.js` a thin, fast function and moves the actual model inference to infrastructure built for it — at the cost of one extra network hop and a dependency on Hugging Face's uptime, which is exactly why it's wrapped in a try/catch that falls back to TF-IDF rather than failing the request.

## Known limitations (stated deliberately, not hidden)

- **TF-IDF, the fallback path, is lexical, not semantic.** It matches on shared words/roots, not meaning, so a question phrased very differently from the corpus wording may retrieve a weaker match. This only matters when semantic retrieval isn't available (no `HF_API_KEY`, or the Hugging Face call failed) — it's a deliberate safety net, not the primary path.
- **The corpus is static.** It's rebuilt by hand from the portfolio's verified data, not synced automatically. A production version would generate `lib/corpus.js` from a single shared source of truth.
- **Conversation memory is stateless on the server.** The frontend resends recent turns with every request rather than the server persisting a session; this is the right call for a demo with no auth/database, but it means a session's history is lost on page refresh and there's no cap on how much a client could (in principle) claim happened earlier in the conversation — `sanitizeHistory` in `api/chat.js` caps length and content size defensively, but doesn't verify the history is genuine.
