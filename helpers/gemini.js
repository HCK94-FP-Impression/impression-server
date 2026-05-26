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

const analyzeProfile = async (targetJob, criteria, cv) => {
  const prompt = `You are a professional HR analyst and career coach. 
  Analyze the following candidate profile and evaluate how well their CV matches their target job.

  Target Job: ${targetJob}
  Evaluation Criteria: ${criteria.join(', ')}

  CV Data:
  - Experiences: ${JSON.stringify(cv.experiences)}
  - Educations: ${JSON.stringify(cv.educations)}
  - Skills: ${cv.skills.join(', ')}

  Return ONLY valid JSON with exactly this schema:
  {
    "aiScore": <float between 0 and 3>,
    "aiInsight": "<2-3 sentences in Indonesian, professional tone, specific to their CV and target job>"
  }

  Rules:
  - aiScore must reflect how competitive this profile is for the target job (0 = not competitive, 3 = very competitive)
  - aiInsight must mention specific skills or experiences from their CV
  - No markdown, no extra keys, no explanation outside the JSON`;

  const result = await genAiStructuredOutput(prompt)
  return result;
};

module.exports = { genAi, genAiStructuredOutput, generateCriteria, analyzeProfile };
