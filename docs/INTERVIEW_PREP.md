# Talking about this project in an interview

## The 30-second version

"I built a RAG chatbot embedded in my portfolio, so recruiters can ask natural-language questions about my experience and get answers grounded in my actual resume data — not a generic bot, and not something that can hallucinate, because it only answers from retrieved context. It's a React frontend, a Vercel serverless function for the backend, hybrid retrieval — semantic matching via a hosted sentence-similarity model, falling back to TF-IDF — over a small knowledge base, an open-weight model (gpt-oss-20b) served via Groq for generation, and it carries conversation history so follow-up questions actually work."

Say that. Then let them ask follow-ups — the rest of this doc is your ammunition.

## Walk-through, in your own words

1. **The problem.** A portfolio can show projects, but a recruiter often wants to ask something specific — "does he know Kafka," "what's his notice period" — that isn't naturally a section on a page. I built a chatbot that answers exactly those questions, grounded in real data.
2. **How a question gets answered.** The message hits a serverless function. It scores every chunk in a small knowledge base against the question using semantic similarity — a hosted sentence-similarity model compares meaning, not just words — and takes the top 4 matches. If that call isn't available for any reason, it falls back automatically to TF-IDF, the original retrieval method: classic information-retrieval math, term frequency weighted by how rare a word is across the corpus, scored by cosine similarity.
3. **Why not just ask an LLM directly?** Because it would hallucinate specifics — wrong dates, invented numbers. RAG constrains it: the system prompt tells the model to answer *only* from the retrieved context, and if nothing relevant was retrieved, to say so and point to my email instead of guessing.
4. **Generation.** The question, the retrieved chunks, and a capped slice of recent conversation history all go to `gpt-oss-20b`, an open-weight model served via Groq's API. I picked Groq specifically because it's fast and has a genuinely free tier — I wanted anyone to be able to clone the repo and run it with zero cost. (I originally used a Llama 3.1 model on Groq; Groq later deprecated the Llama chat models, so I switched to gpt-oss-20b — a good example of why I don't hardcode assumptions about a third-party API's model catalog staying fixed.)
5. **Memory.** The frontend sends recent turns with every request, and the backend forwards a capped slice of them to the model as real prior messages — so "what about at his current job?" resolves against the actual prior question instead of being answered with zero context. Retrieval still runs fresh against just the latest message.
6. **Graceful degradation, two layers deep.** If no Groq key is configured, the app doesn't break — it returns the top retrieved chunk directly instead of a generated sentence. If no Hugging Face key is configured, or that call fails, retrieval doesn't break either — it falls back to TF-IDF. Both are deliberate: never let an optional dependency become a hard failure, and it means anyone who forks the repo gets a fully working demo with zero setup.

## Likely interviewer questions, and how to answer them

**"Why semantic retrieval now, when you originally chose TF-IDF?"**
> "TF-IDF was the right call to ship first — the knowledge base is small, about 25 chunks, and TF-IDF is fast, deterministic, and has zero cold-start cost on a serverless function. But it's lexical: it misses a question phrased very differently from the corpus wording. Once the chatbot was live and I was actually testing it with varied phrasing, that gap was the most visible remaining weakness, so I added semantic retrieval as the primary path and kept TF-IDF as the fallback rather than replacing it outright — that way the 'clone and it just works' property never regresses."

**"Why call out to Hugging Face instead of running the embedding model yourself?"**
> "I considered `transformers.js` running the model directly inside the same serverless function, but a Vercel function is a bad place for that — model weights would need to download on cold start, and the ONNX runtime's native bindings add real bundle-size risk on a platform with a function-size ceiling. Calling a hosted inference API keeps the function thin and pushes the actual model execution onto infrastructure built for it. The cost is one more network hop and a dependency on someone else's uptime — which is exactly why the call is wrapped in a try/catch that falls back to TF-IDF instead of failing the request."

**"How do you prevent it from hallucinating?"**
> "Two layers. First, the system prompt explicitly restricts the model to the retrieved context and tells it to say 'I don't have that detail' rather than guess. Second, if retrieval finds nothing relevant, the context passed to the model is empty, so there's nothing for it to embellish."

**"Why a serverless function instead of a real backend?"**
> "No server to provision or pay for while idle, the API key never touches the browser, and it matches how I'd actually ship a lightweight feature like this in production — not every problem needs a standing service."

**"How does the conversation memory actually work — is there a database?"**
> "No database. The frontend keeps the message list in component state and resends recent turns with every request; the backend caps how many turns and how much text it'll forward, then includes them as real prior messages in the call to the model. It's stateless on the server, which is the right trade-off for a demo with no auth — the honest cost is that history doesn't survive a page refresh, and I'm trusting the client's account of what was said earlier rather than verifying it server-side."

**"What was the hardest part?"**
> "Keeping the retrieval honest even while upgrading it. It's easy to build a chatbot that sounds confident; it's harder to build one that reliably says 'I don't know' instead of inventing an answer when the underlying data doesn't cover the question — and when I swapped in a second retrieval method, I had to make sure that discipline held on both the semantic path and the TF-IDF fallback, not just the one I was actively testing."

## What you should NOT claim

- Don't say retrieval is "always" semantic — it's semantic when `HF_API_KEY` is configured and the call succeeds, otherwise it silently falls back to TF-IDF. The response includes a `retrieval` field (`"semantic"` or `"lexical"`) if you want to point to proof.
- Don't imply this runs 24/7 on a dedicated server — it's serverless, cold-starts on demand.
- Don't overstate the memory as a real session/database — it's client-resent history with server-side caps, not persisted state.
