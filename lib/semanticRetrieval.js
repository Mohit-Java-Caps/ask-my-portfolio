// Semantic retrieval via Hugging Face's hosted sentence-similarity API.
//
// Upgrades on lib/retrieval.js's TF-IDF: this matches on meaning, not just
// shared words, so a follow-up phrased very differently from the corpus
// wording ("does he know cloud stuff" vs. the corpus saying "AWS") can
// still find the right chunk.
//
// Requires HF_API_KEY. If that call fails for any reason — no key
// configured, the model is cold-starting on Hugging Face's side, a
// network hiccup — api/chat.js catches it and falls back to the TF-IDF
// retriever automatically. This is additive, not a hard dependency,
// the same graceful-degradation pattern already used for GROQ_API_KEY.

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2";

const MIN_SCORE = 0.15;

export const retrieveSemantic = async (query, corpus, apiKey, k = 4) => {
  const res = await fetch(HF_MODEL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      inputs: {
        source_sentence: query,
        sentences: corpus.map((c) => c.text),
      },
      options: { wait_for_model: true },
    }),
  });

  if (!res.ok) {
    throw new Error(`Hugging Face API error ${res.status}: ${await res.text()}`);
  }

  const scores = await res.json();
  if (!Array.isArray(scores) || scores.length !== corpus.length || typeof scores[0] !== "number") {
    throw new Error("Unexpected response shape from Hugging Face API.");
  }

  const scored = corpus.map((c, i) => ({
    id: c.id,
    category: c.category,
    text: c.text,
    score: scores[i],
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((s) => s.score > MIN_SCORE);
};
