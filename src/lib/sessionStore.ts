import { Session } from "./types";

const STORAGE_KEY = "meetai_user_sessions_v1";

export function getStoredSessions(): Session[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (err) {
    console.error("Failed to load sessions from storage", err);
    return [];
  }
}

export function saveSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save session to storage", err);
  }
}

export function getSessionById(id: string): Session | null {
  const sessions = getStoredSessions();
  return sessions.find((s) => s.id === id) || null;
}

export function deleteSession(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const sessions = getStoredSessions().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to delete session", err);
  }
}

export function clearAllHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Also remove any legacy keys if any existed
    localStorage.removeItem("meetai_sessions");
  } catch (err) {
    console.error("Failed to clear history", err);
  }
}
