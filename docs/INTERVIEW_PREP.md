# Talking about this project in an interview

## The 30-second version

"I built a RAG chatbot embedded in my portfolio, so recruiters can ask natural-language questions about my experience and get answers grounded in my actual resume data — not a generic bot, and not something that can hallucinate, because it only answers from retrieved context. It's a React frontend, a Vercel serverless function for the backend, TF-IDF retrieval over a small knowledge base, and an open-weight model (gpt-oss-20b) served via Groq for generation."

Say that. Then let them ask follow-ups — the rest of this doc is your ammunition.

## Walk-through, in your own words

1. **The problem.** A portfolio can show projects, but a recruiter often wants to ask something specific — "does he know Kafka," "what's his notice period" — that isn't naturally a section on a page. I built a chatbot that answers exactly those questions, grounded in real data.
2. **How a question gets answered.** The message hits a serverless function. I score every chunk in a small knowledge base against the question using TF-IDF — classic information-retrieval math, term frequency weighted by how rare a word is across the corpus — and take the top 4 matches by cosine similarity.
3. **Why not just ask an LLM directly?** Because it would hallucinate specifics — wrong dates, invented numbers. RAG constrains it: the system prompt tells the model to answer *only* from the retrieved context, and if nothing relevant was retrieved, to say so and point to my email instead of guessing.
4. **Generation.** The question plus the retrieved chunks go to `gpt-oss-20b`, an open-weight model served via Groq's API. I picked Groq specifically because it's fast and has a genuinely free tier — I wanted anyone to be able to clone the repo and run it with zero cost. (I originally used a Llama 3.1 model on Groq; Groq later deprecated the Llama chat models, so I switched to gpt-oss-20b — a good example of why I don't hardcode assumptions about a third-party API's model catalog staying fixed.)
5. **Graceful degradation.** If no API key is configured, the app doesn't break — it just returns the top retrieved chunk directly instead of a generated sentence. I built that in deliberately so the project works out of the box for anyone who forks it, and it's a real production pattern: never let an optional dependency become a hard failure.

## Likely interviewer questions, and how to answer them

**"Why TF-IDF instead of embeddings/vector search?"**
> "The knowledge base is small — about 25 chunks. TF-IDF is fast, deterministic, and has zero cold-start cost, which matters on a serverless function. A learned embedding model is the right call once the corpus is in the hundreds of chunks; for this size, it would've been complexity without a real accuracy benefit. I documented that trade-off in the README rather than pretending TF-IDF is the final answer."

**"How do you prevent it from hallucinating?"**
> "Two layers. First, the system prompt explicitly restricts the model to the retrieved context and tells it to say 'I don't have that detail' rather than guess. Second, if retrieval finds nothing relevant — similarity score of zero across the board — the context passed to the model is empty, so there's nothing for it to embellish."

**"Why a serverless function instead of a real backend?"**
> "No server to provision or pay for while idle, the API key never touches the browser, and it matches how I'd actually ship a lightweight feature like this in production — not every problem needs a standing service."

**"What would you change if this had to scale?"**
> "Swap TF-IDF for a real embedding model once the corpus grows — I'd look at `transformers.js` running inside the same serverless function to avoid a separate vector database for a knowledge base this size. I'd also add conversation memory, since right now every question is answered independently with no context from previous turns."

**"What was the hardest part?"**
> "Keeping the retrieval honest. It's easy to build a chatbot that sounds confident; it's harder to build one that reliably says 'I don't know' instead of inventing an answer when the underlying data doesn't cover the question. That's what the empty-context branch in the prompt logic is for."

## What you should NOT claim

- Don't call the retrieval "semantic search" or "embeddings" — it's TF-IDF, and a technical interviewer may ask you to explain the difference. Say "lexical retrieval" if asked to be precise.
- Don't imply this runs 24/7 on a dedicated server — it's serverless, cold-starts on demand.
- Don't claim it remembers conversation history — it currently doesn't (see limitations above). If asked, say it's a known next step, not a hidden gap.
