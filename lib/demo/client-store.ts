"use client";

import type { Interview } from "@/types/interview";

const INDEX_KEY = "caira:local-interviews";
const interviewKey = (id: string) => `caira:interview:${id}`;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function saveLocalInterview(interview: Interview) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(interviewKey(interview.id), JSON.stringify(interview));

  const ids = new Set<string>(JSON.parse(window.localStorage.getItem(INDEX_KEY) || "[]"));
  ids.add(interview.id);
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(Array.from(ids)));
}

export function getLocalInterview(id: string): Interview | null {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(interviewKey(id));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Interview;
  } catch {
    return null;
  }
}

export function listLocalInterviews(): Interview[] {
  if (!canUseStorage()) return [];
  const ids = JSON.parse(window.localStorage.getItem(INDEX_KEY) || "[]") as string[];
  return ids
    .map((id) => getLocalInterview(id))
    .filter((item): item is Interview => Boolean(item))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function removeLocalInterview(id: string) {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(interviewKey(id));
  const ids = (JSON.parse(window.localStorage.getItem(INDEX_KEY) || "[]") as string[]).filter(
    (value) => value !== id
  );
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(ids));
}

export function markDemoMode(enabled: boolean) {
  if (!canUseStorage()) return;
  if (enabled) window.localStorage.setItem("caira:demo-mode", "1");
  else window.localStorage.removeItem("caira:demo-mode");
}

export function isDemoMode() {
  return canUseStorage() && window.localStorage.getItem("caira:demo-mode") === "1";
}
