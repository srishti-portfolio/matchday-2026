import Anthropic from "@anthropic-ai/sdk";

// Fast + low-cost model, ideal for chat and translation. Override with ANTHROPIC_MODEL.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

/**
 * Read the key, tolerating the two most common .env mistakes: surrounding
 * quotes and stray whitespace, both of which cause a confusing 401.
 * @returns {string} the cleaned key, or "" if unset
 */
function readKey() {
  const raw = process.env.ANTHROPIC_API_KEY || "";
  return raw.trim().replace(/^["']|["']$/g, "");
}

/** @returns {boolean} whether a key is present (not whether it is valid). */
export function isConfigured() {
  return Boolean(readKey());
}

function getClient() {
  const apiKey = readKey();
  return apiKey ? new Anthropic({ apiKey }) : null;
}

/**
 * Turn an SDK error into a message a user can act on, instead of a 500.
 * @param {unknown} err
 * @returns {string}
 */
function explain(err) {
  const status = err?.status;
  if (status === 401) {
    return "The AI key was rejected. Check ANTHROPIC_API_KEY in the server environment - it should start with 'sk-ant-' and have no quotes or spaces around it.";
  }
  if (status === 400 && /credit|billing/i.test(err?.message || "")) {
    return "The AI account has no credit. Add credit at console.anthropic.com under Plans & Billing.";
  }
  if (status === 429) {
    return "The assistant is busy right now - please try again in a moment.";
  }
  if (status === 404) {
    return "The configured AI model wasn't found. Check ANTHROPIC_MODEL.";
  }
  return "The assistant is temporarily unavailable. Please try again.";
}

function textFrom(response) {
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export async function getChatReply(messages, language = "English") {
  const client = getClient();
  if (!client) {
    return {
      configured: false,
      reply:
        "The assistant isn't connected yet. Add ANTHROPIC_API_KEY to the server's environment to enable it.",
    };
  }

  const system = `You are Matchday, a friendly assistant for fans attending the FIFA World Cup 2026 (hosted across the USA, Canada, and Mexico).
Help with stadiums, getting around, transit, tickets, seating, accessibility, food, safety, local tips, and match schedules.
Keep answers concise, warm, and practical. Reply in ${language}. If you're unsure of a live detail (like today's exact kickoff), say so and suggest where to check.`;

  const clean = (messages || [])
    .filter((m) => m && m.content && (m.role === "user" || m.role === "assistant"))
    .map((m) => ({ role: m.role, content: String(m.content) }));

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: clean.length ? clean : [{ role: "user", content: "Hello!" }],
    });
    return { configured: true, reply: textFrom(response) };
  } catch (err) {
    console.error("Chat failed:", err?.status, err?.message);
    return { configured: true, error: explain(err), reply: explain(err) };
  }
}

export async function getTranslation(text, fromLanguage = "auto", toLanguage = "English") {
  const client = getClient();
  if (!client) {
    return {
      configured: false,
      translation: "",
      error: "Translator not connected. Add ANTHROPIC_API_KEY to enable it.",
    };
  }
  if (!text || !text.trim()) {
    return { configured: true, translation: "" };
  }

  const system = `You are a professional translator for World Cup fans. Translate the user's message ${
    fromLanguage === "auto" ? "" : `from ${fromLanguage} `
  }into ${toLanguage}.
Return ONLY the translated text - no quotes, no explanations, no notes. Preserve tone and keep it natural and colloquial, the way a local would say it.`;

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system,
      messages: [{ role: "user", content: String(text) }],
    });
    return { configured: true, translation: textFrom(response) };
  } catch (err) {
    console.error("Translation failed:", err?.status, err?.message);
    return { configured: true, translation: "", error: explain(err) };
  }
}

/**
 * Verify the key actually works by making the smallest possible call.
 * Cached, because /api/health is polled by every client on load.
 * @returns {Promise<{valid:boolean, error?:string}>}
 */
let keyCheck = { at: 0, result: null };
const KEY_CHECK_MS = 60000;

export async function verifyKey() {
  if (!isConfigured()) return { valid: false, error: "No ANTHROPIC_API_KEY set." };
  if (keyCheck.result && Date.now() - keyCheck.at < KEY_CHECK_MS) return keyCheck.result;

  const client = getClient();
  let result;
  try {
    await client.messages.create({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
    result = { valid: true };
  } catch (err) {
    result = { valid: false, error: explain(err) };
  }
  keyCheck = { at: Date.now(), result };
  return result;
}