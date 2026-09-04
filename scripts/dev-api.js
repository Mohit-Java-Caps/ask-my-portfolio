// Minimal local emulator for the Vercel serverless function, so `/api/chat`
// can be exercised with `npm run dev` without needing the Vercel CLI or an
// account. Vercel's real runtime auto-parses JSON bodies and provides
// res.status()/res.json() — this replicates just enough of that surface.
import http from "node:http";
import handler from "../api/chat.js";

const PORT = process.env.DEV_API_PORT || 3001;

const server = http.createServer(async (req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    try {
      req.body = body ? JSON.parse(body) : {};
    } catch {
      req.body = {};
    }
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (obj) => {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(obj));
      return res;
    };
    await handler(req, res);
  });
});

server.listen(PORT, () => console.log(`[dev-api] listening on http://localhost:${PORT}`));
