// MNA website assistant: answers questions about the firm from knowledge/mna-knowledge.md.
// Runs as a Vercel serverless function. Requires ANTHROPIC_API_KEY in the project's environment variables.
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";

const MODEL = "claude-sonnet-5-5";
const MAX_MESSAGES = 12;          // conversation turns sent to the model
const MAX_CHARS = 1500;           // per visitor message
const RATE_LIMIT = 20;            // questions per visitor IP
const RATE_WINDOW_MS = 60 * 60 * 1000;

const KNOWLEDGE = fs.readFileSync(path.join(process.cwd(), "knowledge", "mna-knowledge.md"), "utf8");

const RULES = `You are the website assistant for Mdyesha Ndema Attorneys Inc. (MNA), a South African corporate law firm. You answer visitors' questions about MNA: its services, people, offices, contact details and how to engage the firm.

How to answer:
- Use only the MNA knowledge base below. If the answer is not in it, say you don't have that information and suggest contacting the firm (011 513 3387, info@mnaattorneys.co.za, or the enquiry form at contact.html).
- Keep answers short and clear: usually two to five sentences, or a short list. Plain, professional South African English.
- Where it helps, link to the relevant page with a Markdown link, for example [Services](services.html), [Our Team](team.html#mande), [MNA Forensics](forensics.html) or [Contact us](contact.html).
- Only discuss MNA. Politely decline unrelated requests (general knowledge, writing tasks, coding and so on).

Limits that always apply:
- Do not give legal advice or opinions on anyone's situation, prospects or rights, and do not explain how the law applies to a particular set of facts. When a visitor describes their own matter, say briefly that a director can advise on it and invite them to book a consultation through the enquiry form or by phone. You may say which MNA practice area or person the matter appears to fall under.
- Using this chat does not create an attorney-client relationship. If a visitor starts sharing personal or confidential details of a matter, ask them not to share sensitive information here and to contact the firm directly.
- Never confirm or deny whether any person or organisation is, or was, an MNA client, and do not discuss opposing parties or conflicts.
- Do not quote fees or rates, estimate costs, or promise outcomes or timeframes beyond what the knowledge base states.
- Do not make comparative claims about other firms or describe MNA as "the best".
- For urgent matters, give the phone number.

<knowledge_base>
${KNOWLEDGE}
</knowledge_base>`;

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
const hits = new Map(); // best-effort per-instance rate limiting

function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_LIMIT;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

// Accepts [{role, content}] from the widget; returns a clean, alternating history ending with the user.
function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const msgs = raw
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, m.role === "user" ? MAX_CHARS : 4000) }))
    .filter((m) => m.content)
    .slice(-MAX_MESSAGES);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  for (let i = 1; i < msgs.length; i++) if (msgs[i].role === msgs[i - 1].role) return null;
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

const FALLBACK_TEXT =
  "Sorry, I can't help with that here. Please call 011 513 3387 or use the [enquiry form](contact.html) and a director will assist.";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({ ready: Boolean(client) });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!client) return res.status(503).json({ error: "Assistant not configured" });
  if (!sameOrigin(req)) return res.status(403).json({ error: "Forbidden" });

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) {
    return res.status(429).json({ error: "Too many questions. Please try again later or call 011 513 3387." });
  }

  const body = typeof req.body === "string" ? safeJson(req.body) : req.body;
  const messages = cleanMessages(body && body.messages);
  if (!messages) return res.status(400).json({ error: "Invalid conversation" });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  const send = (obj) => res.write(JSON.stringify(obj) + "\n");

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 2048, // answers are deliberately short
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "between_tools" }, // no extended thinking: quick chat answers
      output_config: { effort: "low" },
      system: [{ type: "text", text: RULES, cache_control: { type: "ephemeral" } }],
      messages,
    });

    let refused = false;
    for await (const event of stream) {
      // A declined answer re-runs on a fallback model; drop any partial text from the first attempt.
      if (event.type === "content_block_start" && event.content_block.type === "fallback") {
        send({ reset: true });
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        send({ t: event.delta.text });
      }
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") {
      refused = true;
      send({ replace: FALLBACK_TEXT });
    }
    const u = final.usage || {};
    console.log(JSON.stringify({
      chat: "ok", model: final.model, stop: final.stop_reason, refused,
      in: u.input_tokens, cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens, out: u.output_tokens,
    }));
    send({ done: true });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      console.error("chat rate limited", err.status);
    } else if (err instanceof Anthropic.APIError) {
      console.error("chat API error", err.status, err.message);
    } else {
      console.error("chat error", err && err.message);
    }
    send({ error: "Sorry, the assistant is unavailable right now. Please call 011 513 3387 or use the enquiry form." });
  }
  res.end();
}

function safeJson(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
