// import { API_BASE_URL } from "../config/api";

// export async function enrollImage(imageFile) {
//   const formData = new FormData();
//   formData.append("file", imageFile);
//   // console.log("In frontend before sending image to backend...")
//   const response = await fetch(`${API_BASE_URL}/enroll/image`, {
//     method: "POST",
//     body: formData,
//   });
//   // console.log("In frontend after sending image to backend...")
//   if (!response.ok) {
//     // console.log("error in receiving response after enrollment...")
//     const error = await response.json();
//     throw new Error(error.detail || "Image enrollment failed");
//   }
//   // console.log("No error in receiving response after enrollment...")
//   return response.json();
// }

// export async function enrollFolder(zipFile) {
//   const formData = new FormData();
//   formData.append("file", zipFile);

//   const response = await fetch(`${API_BASE_URL}/enroll/folder`, {
//     method: "POST",
//     body: formData,
//   });

//   if (!response.ok) {
//     const error = await response.json();
//     throw new Error(error.detail || "Folder enrollment failed");
//   }

//   return response.json();
// }

import { API_BASE_URL } from "../config/api";

/**
 * Uploads a single file (JPG/PNG) for enrollment
 */
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

/**
 * Uploads a ZIP file for bulk enrollment
 */
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

/**
 * NEW: Sends a base64 webcam capture and the user-provided name to the backend
 * @param {string} base64Image - The captured image data
 * @param {string} fullName - The name in employeeId_name format
 */
export async function enrollWebcam(base64Image, fullName) {
  const response = await fetch(`${API_BASE_URL}/enroll/webcam`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image: base64Image,
      name: fullName,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Webcam enrollment failed");
  }

  return response.json();
}