// Debug script to check authentication state
// Run this in browser console to debug the 401 error

console.log("=== Authentication Debug ===");

// Check if token exists
const token = localStorage.getItem("token");
console.log("Token in localStorage:", token);

// Check if user exists
const user = localStorage.getItem("peaple_user");
console.log("User in localStorage:", user);

// Parse user if exists
if (user) {
  try {
    const parsedUser = JSON.parse(user);
    console.log("Parsed user:", parsedUser);
  } catch (e) {
    console.error("Failed to parse user:", e);
  }
}

// Check token validity (basic format check)
if (token && token !== "undefined") {
  console.log("Token format appears valid");
  
  // Try to decode JWT payload (if it's a JWT)
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      console.log("Token payload:", payload);
      console.log("Token expires at:", new Date(payload.exp * 1000));
      console.log("Token is expired:", payload.exp * 1000 < Date.now());
    }
  } catch (e) {
    console.log("Token is not a valid JWT or cannot be decoded");
  }
} else {
  console.log("❌ No valid token found");
}

console.log("========================");
