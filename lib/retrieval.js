// TF-IDF retrieval over a small, fixed corpus.
//
// Deliberately not using an embedding model here: the corpus is ~25 short
// chunks, so a classic TF-IDF/cosine-similarity retriever is fast, has zero
// model-download cold-start cost on a serverless function, and is fully
// deterministic and explainable. A learned embedding model is the natural
// next step if the corpus grows past a few hundred chunks — see README.

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "of", "in", "on", "at", "to", "for", "with", "and", "or", "but", "not",
  "he", "she", "it", "his", "her", "its", "they", "them", "their",
  "do", "does", "did", "has", "have", "had", "will", "would", "can", "could",
  "what", "who", "how", "when", "where", "why", "which", "this", "that",
  "i", "you", "me", "my", "your", "about", "as", "if", "so", "than",
]);

const tokenize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));

const termFrequency = (tokens) => {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
};

// Builds document-frequency counts once per request over the fixed corpus.
const buildIndex = (corpus) => {
  const docs = corpus.map((c) => ({ ...c, tokens: tokenize(c.text), tf: null }));
  docs.forEach((d) => (d.tf = termFrequency(d.tokens)));

  const df = new Map();
  for (const d of docs) {
    for (const term of new Set(d.tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }
  const N = docs.length;
  const idf = new Map();
  for (const [term, count] of df.entries()) {
    idf.set(term, Math.log((N + 1) / (count + 1)) + 1);
  }
  return { docs, idf, N };
};

const vectorize = (tf, idf) => {
  const vec = new Map();
  for (const [term, count] of tf.entries()) {
    vec.set(term, count * (idf.get(term) || Math.log(2)));
  }
  return vec;
};

const cosineSim = (a, b) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, val] of a.entries()) {
    normA += val * val;
    if (b.has(term)) dot += val * b.get(term);
  }
  for (const val of b.values()) normB += val * val;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Returns the top-k most relevant chunks for a query, each with a
// similarity score, so the UI can show exactly what grounded the answer.
export const retrieve = (query, corpus, k = 4) => {
  const { docs, idf } = buildIndex(corpus);
  const queryTf = termFrequency(tokenize(query));
  const queryVec = vectorize(queryTf, idf);

  const scored = docs.map((d) => ({
    id: d.id,
    category: d.category,
    text: d.text,
    score: cosineSim(queryVec, vectorize(d.tf, idf)),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k).filter((s) => s.score > 0);
};
