import { API_BASE_URL } from "../config/api";

// Start the Camera (Local or Remote)
export async function startLiveStream(source = "0") {
  const res = await fetch(`${API_BASE_URL}/live/start?source=${encodeURIComponent(source)}`);
  if (!res.ok) throw new Error("Failed to start camera");
  return res.json();
}

// Stop the Camera
export async function stopLiveStream() {
  const res = await fetch(`${API_BASE_URL}/live/stop`);
  if (!res.ok) throw new Error("Failed to stop camera");
  return res.json();
}

// Fetch Active Sessions (For the Real-Time Table)
// We will filter the existing /analysis/logs endpoint by "today" to get live data
export async function getLiveActivity() {
  // Get today's date in DD-MM-YYYY format
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const dateStr = `${dd}-${mm}-${yyyy}`;

  const res = await fetch(`${API_BASE_URL}/analysis/logs?date=${dateStr}`);
  if (!res.ok) throw new Error("Failed to fetch live logs");
  return res.json();
}