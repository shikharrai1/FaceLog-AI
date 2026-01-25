import { API_BASE_URL } from "../config/api";

export async function getStats() {
  const res = await fetch(`${API_BASE_URL}/analysis/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

export async function getEnrolledPersons() {
  const res = await fetch(`${API_BASE_URL}/analysis/persons`);
  if (!res.ok) throw new Error("Failed to fetch gallery");
  return res.json();
}


export async function getLogs(name = "", date = "") {
  // Build query string: /analysis/logs?name=Abdul&date=22-01-2026
  const params = new URLSearchParams();
  if (name) params.append("name", name);
  if (date) params.append("date", date);

  const res = await fetch(`${API_BASE_URL}/analysis/logs?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  return res.json();
}

export async function resetLogsOnly() {
  const res = await fetch(`${API_BASE_URL}/analysis/reset_logs`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to reset logs");
  return res.json();
}

export async function nukeSystem() {
  const res = await fetch(`${API_BASE_URL}/analysis/nuke_system`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("System reset failed");
  return res.json();
}