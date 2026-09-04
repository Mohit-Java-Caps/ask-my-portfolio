import { corpus } from "../lib/corpus.js";
import { retrieve } from "../lib/retrieval.js";
import { SYSTEM_PROMPT, buildUserPrompt } from "../lib/prompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";
const MAX_MESSAGE_LENGTH = 500;

const setCors = (res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });

  const { message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "Message is required." });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: `Keep it under ${MAX_MESSAGE_LENGTH} characters.` });
  }

  const sources = retrieve(message, corpus, 4);
  const apiKey = process.env.GROQ_API_KEY;

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
    });
  } catch (err) {
    console.error("Chat handler error:", err);
    return res.status(500).json({ error: "Something went wrong on the server." });
  }
}
