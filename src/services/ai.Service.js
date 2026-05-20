import genAI from "../config/gemini.js";

export const generateAIResponse = async (messages) => {

  // Gemini model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });

  // Convert messages into prompt
  const prompt = messages
    .map(
      (msg) =>
        `${msg.role}: ${msg.content}`
    )
    .join("\n");

  // Generate response
  const result = await model.generateContent(prompt);

  const response = result.response.text();

  return response;
};