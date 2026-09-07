import { corpus } from "../lib/corpus.js";
import { retrieve } from "../lib/retrieval.js";
import { retrieveSemantic } from "../lib/semanticRetrieval.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
// Groq's hosted-model lineup changes over time — verify against
// console.groq.com/playground if this ever needs to change again.
const GROQ_MODEL = "openai/gpt-oss-20b";
const MAX_MESSAGE_LENGTH = 500;
// Prior turns are for conversational memory only, not re-retrieved — cap
// how much of them we forward so a long session can't blow up the prompt.
const MAX_HISTORY_TURNS = 6;
const MAX_HISTORY_CONTENT_LENGTH = 800;

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const sanitizeHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((h) => h && (h.role === "user" || h.role === "assistant") && typeof h.content === "string")
    .slice(-MAX_HISTORY_TURNS)
    .map((h) => ({ role: h.role, content: h.content.slice(0, MAX_HISTORY_CONTENT_LENGTH) }));
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { message, history } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Keep it under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  const priorTurns = sanitizeHistory(history);

  // Hybrid retrieval: try semantic (meaning-based) matching first, fall
  // back to TF-IDF (word-based) if no key is configured or the call
  // fails for any reason. Never a hard dependency.
  const hfKey = process.env.HF_API_KEY?.trim();
  let sources;
  let retrieval = "lexical";
  if (hfKey) {
    try {
      sources = await retrieveSemantic(message, corpus, hfKey, 4);
      retrieval = "semantic";
    } catch (err) {
      console.error("Semantic retrieval failed, falling back to TF-IDF:", err.message);
      sources = retrieve(message, corpus, 4);
    }
  } else {
    sources = retrieve(message, corpus, 4);
  }

  const apiKey = process.env.GROQ_API_KEY?.trim();

  // Graceful degradation: no key configured (e.g. a local clone with no
  // secrets set up yet) still returns a real, grounded answer — just
  // extractive instead of generated.
  if (!apiKey) {
    const answer = sources.length
      ? sources[0].text
      : "Mohit hasn't published details on that yet — email him directly at mohitlogin72@gmail.com.";
    return res.status(200).json({
      answer,
      sources: sources.map(({ id, category, score }) => ({ id, category, score: Number(score.toFixed(3)) })),
      mode: "extractive",
      retrieval,
    });
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...priorTurns,
          { role: "user", content: buildUserPrompt(message, sources) },
        ],
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq API error:", groqRes.status, errText);
      return res.status(502).json({ error: "The model backend failed. Try again in a moment." });
    }

    const data = await groqRes.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate an answer.";

    return res.status(200).json({
      answer,
      sources: sources.map(({ id, category, score }) => ({ id, category, score: Number(score.toFixed(3)) })),
      mode: "generated",
      retrieval,
    });
  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
}
