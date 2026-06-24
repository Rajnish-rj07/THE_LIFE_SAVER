import { GoogleGenAI } from "@google/genai";
async function run() {
try {
  console.log("Testing fetch directly...");
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    })
  });
  console.log("Status:", res.status);
  console.log("Body:", await res.text());
} catch (e) {
  console.log("Error:", e.message);
}
}
run();
