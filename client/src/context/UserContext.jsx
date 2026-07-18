import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { visitId } from "../data.js";
import {
  ApiError,
  fetchHealth,
  fetchProfile,
  login as apiLogin,
  patchProfile,
  postAttended,
  register as apiRegister,
  setToken,
  getToken,
} from "../api.js";

const UserContext = createContext(null);

const ACCOUNTS_KEY = "matchday.accounts";
const SESSION_KEY = "matchday.session";

/**
 * Two modes:
 *  - "db": the server has a DATABASE_URL (Neon). Real accounts, bcrypt-hashed
 *    passwords, JWT sessions. Nothing sensitive is kept in the browser.
 *  - "local": no database configured. Demo accounts in localStorage so the app
 *    still runs anywhere. Never use this mode for real users.
 */

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

/**
 * Older builds stored `attended` as an array of match-id strings. Normalise
 * those to the current {id, seat} shape so existing demo accounts keep working.
 * @param {Array<string|{id:string,seat?:string|null}>} [list]
 * @returns {Array<{id:string, seat:string|null}>}
 */
function normaliseAttended(list) {
  if (!Array.isArray(list)) return [];
  return list.map((a) => (typeof a === "string" ? { id: a, seat: null } : a));
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("local");

  // Decide the mode from the server, then restore any existing session.
  useEffect(() => {
    let alive = true;

    (async () => {
      let dbMode = false;
      try {
        const health = await fetchHealth();
        dbMode = Boolean(health?.dbConfigured);
      } catch {
        dbMode = false; // server unreachable: demo mode
      }
      if (!alive) return;
      setMode(dbMode ? "db" : "local");

      if (dbMode) {
        if (getToken()) {
          try {
            const { user: u, attended } = await fetchProfile();
            if (alive)
              setUser({
                ...u,
                attended: attended.map((a) => ({ id: a.matchId, seat: a.seat })),
                selection: null,
              });
          } catch {
            setToken(null); // expired or invalid
          }
        }
      } else {
        const name = localStorage.getItem(SESSION_KEY);
        if (name) {
          const acct = readAccounts()[name];
          if (acct && alive) setUser({ ...acct, attended: normaliseAttended(acct.attended) });
        }
      }
      if (alive) setReady(true);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const persistLocal = useCallback((updated) => {
    const accounts = readAccounts();
    accounts[updated.name] = updated;
    writeAccounts(accounts);
    localStorage.setItem(SESSION_KEY, updated.name);
    setUser(updated);
  }, []);

  const signUp = useCallback(
    async ({ name, password, language }) => {
      if (mode === "db") {
        try {
          const { token, user: u } = await apiRegister({ name, password, language });
          setToken(token);
          setUser({ ...u, attended: [], selection: null });
          return { ok: true };
        } catch (err) {
          if (err instanceof ApiError && err.code === "exists") {
            return { ok: false, code: "exists", error: err.message };
          }
          return { ok: false, error: err.message || "Could not create your account." };
        }
      }

      const accounts = readAccounts();
      if (accounts[name]) {
        return {
          ok: false,
          code: "exists",
          error: "You already have an account with this name. Try signing in instead.",
        };
      }
      persistLocal({ name, password, language, avatar: null, selection: null, attended: [] });
      return { ok: true };
    },
    [mode, persistLocal]
  );

  const signIn = useCallback(
    async ({ name, password }) => {
      if (mode === "db") {
        try {
          const { token, user: u } = await apiLogin({ name, password });
          setToken(token);
          const { attended } = await fetchProfile().catch(() => ({ attended: [] }));
          setUser({
            ...u,
            attended: attended.map((a) => ({ id: a.matchId, seat: a.seat })),
            selection: null,
          });
          return { ok: true };
        } catch (err) {
          return { ok: false, error: err.message || "Could not sign you in." };
        }
      }

      const acct = readAccounts()[name];
      if (!acct) return { ok: false, code: "missing", error: "No account with that name yet." };
      if (acct.password !== password) return { ok: false, error: "Incorrect password." };
      localStorage.setItem(SESSION_KEY, name);
      setUser(acct);
      return { ok: true };
    },
    [mode]
  );

  const signOut = useCallback(() => {
    if (mode === "db") setToken(null);
    else localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, [mode]);

  const updateProfile = useCallback(
    async (patch) => {
      if (!user) return { ok: false };

      if (mode === "db") {
        try {
          const { user: u } = await patchProfile(patch);
          setUser((prev) => ({ ...prev, ...u }));
          return { ok: true };
        } catch (err) {
          if (err instanceof ApiError && err.code === "exists") {
            return { ok: false, error: "That name is taken." };
          }
          return { ok: false, error: err.message || "Could not save changes." };
        }
      }

      const accounts = readAccounts();
      const updated = { ...user, ...patch };
      if (patch.name && patch.name !== user.name) {
        if (accounts[patch.name]) return { ok: false, error: "That name is taken." };
        delete accounts[user.name];
      }
      persistLocal(updated);
      return { ok: true };
    },
    [mode, user, persistLocal]
  );

  const setSelection = useCallback(
    (selection) => {
      if (!user) return;
      if (mode === "db") setUser((prev) => ({ ...prev, selection }));
      else persistLocal({ ...user, selection });
    },
    [mode, user, persistLocal]
  );

  /**
   * Record a stadium visit. Works whether or not the visit lines up with an
   * official fixture - the visit id encodes stadium + date so the You tab can
   * always show it (see data.js visitId/decodeVisit).
   * @param {string} stadiumKey
   * @param {string} date YYYY-MM-DD
   * @param {string|null} [seat]
   */
  const addAttended = useCallback(
    async (stadiumKey, date, seat = null) => {
      if (!user || !stadiumKey || !date) return;
      const id = visitId(stadiumKey, date);
      if (user.attended.some((a) => a.id === id)) return; // already recorded
      const visit = { id, seat: seat ?? null };

      if (mode === "db") {
        setUser((prev) => ({ ...prev, attended: [...prev.attended, visit] })); // optimistic
        try {
          await postAttended(id, seat);
        } catch {
          /* keep the optimistic value; it'll resync on next profile load */
        }
        return;
      }
      persistLocal({ ...user, attended: [...user.attended, visit] });
    },
    [mode, user, persistLocal]
  );

  // Memoised so consumers don't re-render on unrelated parent updates.
  const value = useMemo(
    () => ({ user, ready, mode, signUp, signIn, signOut, updateProfile, setSelection, addAttended }),
    [user, ready, mode, signUp, signIn, signOut, updateProfile, setSelection, addAttended]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
