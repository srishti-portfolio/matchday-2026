import { useEffect, useRef, useState } from "react";
import { useUser } from "../context/UserContext.jsx";
import { useT } from "../i18n/I18nContext.jsx";
import { LANGUAGES } from "../data.js";
import { sendChat, translateText } from "../api.js";

export default function Assistant() {
  const t = useT();
  const { user } = useUser();
  const [mode, setMode] = useState("translator");

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="floodlit px-5 pt-7 pb-4">
        <div className="flex items-center gap-2 text-pitch text-xs font-semibold tracking-[0.15em] uppercase">
          <span className="w-2 h-2 rounded-full bg-live animate-pulseLive" />
          {t("assistant.eyebrow")}
        </div>
        <h2 className="font-display font-extrabold text-2xl mt-3">{t("assistant.title")}</h2>

        <div className="flex bg-ink rounded-full p-1 mt-4 border border-line">
          {[
            { id: "translator", key: "assistant.translator" },
            { id: "chat", key: "assistant.chat" },
          ].map((seg) => (
            <button
              key={seg.id}
              onClick={() => setMode(seg.id)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-colors ${
                mode === seg.id ? "bg-pitch text-ink" : "text-muted"
              }`}
            >
              {t(seg.key)}
            </button>
          ))}
        </div>
      </header>

      {mode === "translator" ? (
        <Translator nativeLanguage={user.language} />
      ) : (
        <Chat language={user.language} />
      )}
    </div>
  );
}

function Translator({ nativeLanguage }) {
  const t = useT();
  const [fromLang, setFromLang] = useState(nativeLanguage);
  const [toLang, setToLang] = useState(nativeLanguage === "English" ? "Spanish" : "English");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  async function translate() {
    if (!text.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const data = await translateText(text, fromLang, toLang);
      const out = data.translation || data.error || t("assistant.noTranslation");
      setResult(out);
      if (data.translation) speak(out, toLang); // auto read-aloud on success
    } catch {
      setResult(t("assistant.translateFailed"));
    } finally {
      setLoading(false);
    }
  }

  function swap() {
    setFromLang(toLang);
    setToLang(fromLang);
    setText(result && !result.startsWith("Translation failed") ? result : text);
    setResult("");
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setResult(t("assistant.voiceUnsupported"));
      return;
    }
    const rec = new SR();
    rec.lang = langCode(fromLang);
    rec.interimResults = false;
    rec.onresult = (e) => setText(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  function speak(what, lang) {
    const say = typeof what === "string" ? what : result;
    if (!say || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(say);
    u.lang = langCode(lang || toLang);
    window.speechSynthesis.speak(u);
  }

  return (
    <div className="px-5 py-5 flex-1">
      <div className="bg-surface border border-line rounded-2xl p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              {t("assistant.yourLanguage")}
            </label>
            <select
              value={fromLang}
              onChange={(e) => setFromLang(e.target.value)}
              className="w-full bg-ink border border-line rounded-xl px-3 py-3 text-text focus:border-pitch outline-none appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={swap}
            aria-label={t("assistant.swap")}
            className="mb-0.5 w-10 h-11 shrink-0 rounded-xl bg-elevated border border-line flex items-center justify-center active:scale-95 transition-transform"
          >
            <SwapIcon />
          </button>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
              {t("assistant.translateTo")}
            </label>
            <select
              value={toLang}
              onChange={(e) => setToLang(e.target.value)}
              className="w-full bg-ink border border-line rounded-xl px-3 py-3 text-text focus:border-pitch outline-none appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.name}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="relative mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("assistant.inputPlaceholder", { language: fromLang })}
          rows={3}
          className="w-full bg-ink border border-line rounded-2xl px-4 py-3 pr-24 text-text placeholder:text-muted/60 focus:border-pitch outline-none resize-none"
        />
        <div className="absolute right-3 top-3 flex gap-2">
          {text.trim() && (
            <button
              onClick={() => speak(text, fromLang)}
              aria-label={t("assistant.playYourText")}
              className="w-9 h-9 rounded-full flex items-center justify-center border bg-elevated border-line"
            >
              <SpeakIcon />
            </button>
          )}
          <button
            onClick={startVoice}
            aria-label={t("assistant.startVoice")}
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${
              listening ? "bg-live/20 border-live animate-pulseLive" : "bg-elevated border-line"
            }`}
          >
            <MicIcon active={listening} />
          </button>
        </div>
      </div>

      <button
        onClick={translate}
        disabled={loading}
        className="w-full mt-3 bg-pitch text-ink font-display font-extrabold py-3 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-60"
      >
        {loading ? t("assistant.translating") : t("assistant.translate")}
      </button>

      {result && (
        <div className="mt-4 bg-pitch/10 border border-pitch/30 rounded-2xl p-4 animate-fadeUp">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-pitch uppercase tracking-wider">
              {toLang}
            </span>
            <button
              onClick={() => speak(result, toLang)}
              className="text-xs text-muted flex items-center gap-1 active:scale-95 transition-transform"
            >
              <SpeakIcon /> {t("assistant.play")}
            </button>
          </div>
          <p className="text-text leading-relaxed">{result}</p>
        </div>
      )}
    </div>
  );
}

function Chat({ language }) {
  const t = useT();
  const [messages, setMessages] = useState(() => [
    { role: "assistant", content: t("assistant.chatGreeting") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const data = await sendChat(next.slice(1), language);
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: t("assistant.chatFailed") },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-pitch text-ink rounded-br-sm"
                  : "bg-surface border border-line rounded-bl-sm"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-line rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                <Dot /> <Dot delay="0.15s" /> <Dot delay="0.3s" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 bg-surface border-t border-line p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("assistant.chatPlaceholder")}
            className="flex-1 bg-ink border border-line rounded-full px-4 py-2.5 text-text placeholder:text-muted/60 focus:border-pitch outline-none"
          />
          <button
            onClick={send}
            disabled={loading}
            className="w-11 h-11 rounded-full bg-pitch text-ink flex items-center justify-center active:scale-95 transition-transform disabled:opacity-60"
            aria-label={t("assistant.send")}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function langCode(name) {
  const map = {
    English: "en-US",
    Spanish: "es-ES",
    French: "fr-FR",
    Portuguese: "pt-BR",
    German: "de-DE",
    Italian: "it-IT",
    Arabic: "ar-SA",
    Japanese: "ja-JP",
    Korean: "ko-KR",
    Hindi: "hi-IN",
    Chinese: "zh-CN",
    Dutch: "nl-NL",
  };
  return map[name] || "en-US";
}

function Dot({ delay = "0s" }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-muted animate-pulseLive"
      style={{ animationDelay: delay }}
    />
  );
}
function MicIcon({ active }) {
  const stroke = active ? "#FF3B6B" : "#8B97A8";
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v4" />
    </svg>
  );
}
function SpeakIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8B97A8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17 8a5 5 0 0 1 0 8" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2DD36F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4 4 7l3 3" />
      <path d="M4 7h13" />
      <path d="m17 20 3-3-3-3" />
      <path d="M20 17H7" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0B0E13" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12l16-8-6 16-3-6-7-2Z" />
    </svg>
  );
}
