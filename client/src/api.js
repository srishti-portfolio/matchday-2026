/**
 * Thin API layer for the Matchday backend.
 *
 * BASE is empty in dev (Vite proxies /api to the Express server) and set to
 * VITE_API_URL in production builds.
 */
const BASE = import.meta.env.VITE_API_URL || "";

const TOKEN_KEY = "matchday.token";

/** @returns {string|null} the stored JWT, if signed in against the database. */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

/** Error carrying the HTTP status and any server-provided code. */
export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status, data?.code);
  }
  return data;
}

/* ------------------------------- system --------------------------------- */

/** @returns {Promise<{ok:boolean, aiConfigured:boolean, dbConfigured:boolean}>} */
export function fetchHealth() {
  return request("/api/health");
}

/* -------------------------------- auth ---------------------------------- */

export function register({ name, password, language }) {
  return request("/api/auth/register", { method: "POST", body: { name, password, language } });
}

export function login({ name, password }) {
  return request("/api/auth/login", { method: "POST", body: { name, password } });
}

export function fetchProfile() {
  return request("/api/profile", { auth: true });
}

export function patchProfile(patch) {
  return request("/api/profile", { method: "PATCH", body: patch, auth: true });
}

export function postAttended(matchId, seat) {
  return request("/api/attended", { method: "POST", body: { matchId, seat }, auth: true });
}

/* ------------------------------ features -------------------------------- */

export function sendChat(messages, language) {
  return request("/api/chat", { method: "POST", body: { messages, language } });
}

export function translateText(text, fromLanguage, toLanguage) {
  return request("/api/translate", { method: "POST", body: { text, fromLanguage, toLanguage } });
}

export function fetchMatches() {
  return request("/api/matches");
}

export function fetchCrowd(stadiumKey, gates) {
  const q = encodeURIComponent(gates.join(","));
  return request(`/api/crowd/${encodeURIComponent(stadiumKey)}?gates=${q}`);
}

export function saveCrowd(stadiumKey, levels) {
  return request(`/api/crowd/${encodeURIComponent(stadiumKey)}`, {
    method: "POST",
    body: { levels },
  });
}
