
import { API_BASE_URL } from "../config/api";

export async function recognizeVideo(videoFile) {
  const formData = new FormData();
  formData.append("file", videoFile);

  const response = await fetch(`${API_BASE_URL}/recognize/video`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Video processing failed");
  }

  return response.json();
}

export async function stopProcessing() {
  await fetch(`${API_BASE_URL}/recognize/stop`, {
    method: "POST",
  });
}