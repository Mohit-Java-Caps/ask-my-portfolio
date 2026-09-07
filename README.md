# Ask My Portfolio

A retrieval-augmented generation (RAG) chatbot embedded in a portfolio site. A recruiter can ask "What did Mohit build at NextEra Energy?" or "Is he open to contract roles?" and get an answer grounded in his real, resume-verified data — not a generic canned bot, and not a hallucinated one.

**Live demo:** https://ask-my-portfolio-khaki.vercel.app/

![Conversation](docs/screenshots/04-full-conversation.png)

## Why this exists

Most portfolio "AI" sections describe RAG conceptually. This one *is* a working RAG pipeline, built specifically to answer the questions a recruiter actually asks — including logistics (notice period, comp expectations, work mode) that don't fit naturally into a resume.

## How it works

```
User question + recent conversation history
     │
     ▼
Hybrid retrieval over a fixed knowledge base
     │  semantic (Hugging Face sentence-similarity)  →  falls back to  →  TF-IDF
     │  (lib/semanticRetrieval.js)                        (lib/retrieval.js)
     │  → top-4 most relevant chunks, each with a similarity score
     ▼
Prompt assembly: system + prior turns + retrieved context   (lib/prompt.js)
     │
     ▼
Groq (gpt-oss-20b) generates the answer, grounded only in that context
     │
     ▼
Response + source tags returned to the UI
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the full flow diagram and the reasoning behind each decision, and [`docs/INTERVIEW_PREP.md`](docs/INTERVIEW_PREP.md) for how to talk about this project out loud.

### A deliberate design choice: graceful degradation, two layers deep

If `GROQ_API_KEY` isn't set, `/api/chat` doesn't break — it returns the single most relevant retrieved chunk directly instead of a generated answer (tagged `"mode": "extractive"` in the response, and shown as a **demo mode** badge in the UI). If `HF_API_KEY` isn't set, or the Hugging Face call fails for any reason, retrieval doesn't break either — it falls back to TF-IDF (tagged `"retrieval": "lexical"` vs. `"semantic"` in the response). Anyone who clones this repo gets a fully working demo with zero setup; both the generative layer and the semantic-retrieval layer are additive, never hard dependencies.

### Semantic retrieval, with TF-IDF as the fallback

Retrieval now tries meaning-based matching first: the question and every corpus chunk are compared via a hosted sentence-similarity model (`sentence-transformers/all-MiniLM-L6-v2`, called through Hugging Face's Inference API), so a question phrased very differently from the corpus wording — "does he know cloud stuff" vs. the corpus saying "AWS" — still finds the right chunk. TF-IDF (word-overlap matching) is the original implementation and now serves as the automatic fallback if no `HF_API_KEY` is set or the call fails — it's fast, deterministic, and has zero cold-start cost, which is exactly why it was the whole system originally. Keeping it as the fallback rather than deleting it meant upgrading retrieval quality without ever risking the "clone and it just works" property.

### Conversation memory

The frontend now sends recent turns (not just the latest message) with each request, and the backend forwards a capped slice of that history to the model as real prior turns — so a follow-up like "what about at his current job?" resolves correctly instead of being answered as if it arrived with no context. Retrieval itself still runs fresh against only the latest question; history is for the model's conversational memory, not for what gets retrieved.

## Screenshots

| Empty state | First answer |
|---|---|
| ![Empty state](docs/screenshots/01-empty-state.png) | ![First answer](docs/screenshots/02-first-answer.png) |

| Multi-turn conversation | Mobile |
|---|---|
| ![Conversation](docs/screenshots/03-conversation.png) | ![Mobile](docs/screenshots/05-mobile.png) |

## Tech stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Backend:** Vercel serverless function (Node.js), no separate server to manage
- **Retrieval:** semantic (Hugging Face sentence-similarity, `all-MiniLM-L6-v2`) with a hand-rolled TF-IDF/cosine-similarity fallback (see above)
- **Generation:** [Groq](https://groq.com) API, `openai/gpt-oss-20b` — fast, free tier, no credit card
- **Memory:** recent conversation turns are sent with each request and forwarded to the model, so follow-up questions resolve correctly
- **Knowledge base:** `lib/corpus.js` — structured chunks sourced from the same verified data as [the main portfolio](https://mohit-java-caps.github.io/mohit-portfolio/)

## Running locally

```bash
npm install
npm run dev
```

This starts the Vite dev server *and* a local Node emulator for the `/api/chat` serverless function together (`concurrently`), proxied so the frontend can call `/api/chat` exactly as it will in production. No Vercel CLI or account needed for local development.

Open `http://localhost:5173`.

### Enabling generated answers and semantic retrieval locally

```bash
cp .env.example .env
# then edit .env and paste in:
#   GROQ_API_KEY  from https://console.groq.com          (generated answers)
#   HF_API_KEY    from https://huggingface.co/settings/tokens   (semantic retrieval)
```

Both are optional — without either, the app still runs, just on the fallback paths (extractive answers, TF-IDF retrieval).

## Deploying

1. Push this repo to GitHub (already done if you're reading this on GitHub).
2. Import the repo into [Vercel](https://vercel.com/new) — it auto-detects the Vite build.
3. In the Vercel project's **Settings → Environment Variables**, add `GROQ_API_KEY` from [console.groq.com](https://console.groq.com) and, optionally, `HF_API_KEY` from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).
4. Deploy. The `/api/chat` route is picked up automatically as a serverless function — no extra config needed.

## Project structure

```
api/chat.js                Vercel serverless function — the only backend route
lib/corpus.js               Knowledge base (resume-verified chunks)
lib/retrieval.js            TF-IDF retrieval (fallback)
lib/semanticRetrieval.js     Semantic retrieval via Hugging Face (primary, when configured)
lib/prompt.js               System prompt + context assembly
src/                        React frontend (Vite)
scripts/dev-api.js          Local emulator for api/chat.js, no Vercel CLI needed
docs/                       Architecture diagram + interview prep notes
```

## License

MIT
