
import { API_BASE_URL } from "../config/api";

export async function recognizeVideo(videoFile) {
  console.log("Inside RecognitionAPI.js Frontend 1")
  const formData = new FormData();
  formData.append("file", videoFile);
  console.log("Inside RecognitionAPI.js Frontend before sending video to backend...")
  const response = await fetch(`${API_BASE_URL}/recognize/video`, {
    method: "POST",
    body: formData,
  });
  console.log("Inside RecognitionAPI.js Frontend after receiving response...")
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Video processing failed");
  }
  console.log("Inside RecognitionAPI.js Frontend after receiving response response is okay and is being sent to UI...")
  return response.json();
}

export async function stopProcessing() {
  await fetch(`${API_BASE_URL}/recognize/stop`, {
    method: "POST",
  });
}