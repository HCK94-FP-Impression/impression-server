const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const genAi = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });
  return response.text;
};

const genAiStructuredOutput = async (prompt) => {
  const response = await genAi(prompt);
  const json = response.replace("```json", "").replace("```", "").trim();
  return JSON.parse(json);
};

const generateCriteria = async (targetJob) => {
  const prompt = `You are a strict JSON generator. 
  Return only valid JSON with exactly this schema: {"criteria":["word1","word2","word3"]}. 
  Rules: exactly 3 short adjectives in English that reflect the professional impression of a profile photo for someone targeting the role of ${targetJob}. 
  The adjectives should reflect qualities that are characteristic and valued in that specific role, as conveyed through appearance and demeanor. 
  No technical skills. No numbering, no explanation, no markdown, no extra keys. Return the JSON now.`;

  const result = await genAiStructuredOutput(prompt);
  return result.criteria;
};

module.exports = { genAi, genAiStructuredOutput, generateCriteria };
