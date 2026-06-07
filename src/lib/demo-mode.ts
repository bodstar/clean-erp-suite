/**
 * @module lib/demo-mode
 * Runtime demo-mode toggle. Persists to localStorage so all API modules
 * (which call `isDemoMode()` at request time) reflect the current state.
 * Default = !VITE_API_BASE_URL (matches prior build-time behaviour).
 */

const STORAGE_KEY = "lovable.demo_mode";

function defaultDemo(): boolean {
  return !import.meta.env.VITE_API_BASE_URL;
}

/** @returns Whether demo mode is currently active. */
export function isDemoMode(): boolean {
  if (typeof window === "undefined") return defaultDemo();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === null) return defaultDemo();
  return raw === "1";
}

/**
 * Persist a new demo-mode value. Triggers a full page reload so module-level
 * caches (AuthProvider bootstrap, Axios interceptors, etc.) re-evaluate.
 * @param enabled Desired state.
 */
export function setDemoMode(enabled: boolean): void {
  window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
  window.location.reload();
}