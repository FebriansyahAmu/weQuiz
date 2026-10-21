/**
 * Per-browser conveniences in localStorage. Storage can be unavailable (private
 * mode, blocked site data), so every access is guarded and failures are ignored.
 */

const ACTIVE_ATTEMPT_KEY = "wequiz-active-attempt";
const LAST_NAME_KEY = "wequiz-last-name";

export interface ActiveAttempt {
  id: string;
  name: string;
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Ignore: these values are optional conveniences.
  }
}

export function getActiveAttempt(): ActiveAttempt | null {
  const raw = read(ACTIVE_ATTEMPT_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ActiveAttempt>;
    return typeof value.id === "string" && typeof value.name === "string" ? { id: value.id, name: value.name } : null;
  } catch {
    return null;
  }
}

export const setActiveAttempt = (attempt: ActiveAttempt) => write(ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
export const clearActiveAttempt = () => write(ACTIVE_ATTEMPT_KEY, null);

export const getLastName = () => read(LAST_NAME_KEY);
export const setLastName = (name: string) => write(LAST_NAME_KEY, name);
