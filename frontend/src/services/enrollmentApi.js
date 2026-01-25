import { API_BASE_URL } from "../config/api";

export async function enrollImage(imageFile) {
  const formData = new FormData();
  formData.append("file", imageFile);

  const response = await fetch(`${API_BASE_URL}/enroll/image`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Image enrollment failed");
  }

  return response.json();
}

export async function enrollFolder(zipFile) {
  const formData = new FormData();
  formData.append("file", zipFile);

  const response = await fetch(`${API_BASE_URL}/enroll/folder`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Folder enrollment failed");
  }

  return response.json();
}
