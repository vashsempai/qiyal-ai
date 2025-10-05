import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const GeminiService = {
  async generateProjectSummary(projectDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Summarize this project description in 2-3 sentences, highlighting key requirements and skills needed: ${projectDescription}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async suggestSkills(projectDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Based on this project description, suggest 5-8 relevant skills/technologies as a comma-separated list: ${projectDescription}`;

    const result = await model.generateContent(prompt);
    return result.response.text().split(',').map(skill => skill.trim());
  },

  async generateCoverLetter(userProfile, projectDescription) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Write a professional cover letter for this freelancer profile: ${JSON.stringify(userProfile)} applying to this project: ${projectDescription}`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  },

  async moderateContent(content) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Analyze this content for inappropriate material, spam, or violations. Return JSON with {isAppropriate: boolean, reason: string}: ${content}`;

    const result = await model.generateContent(prompt);
    try {
      // The Gemini API may return the JSON string with markdown backticks.
      const cleanedText = result.response.text().replace(/```json|```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Failed to parse Gemini moderation response:", error);
      return { isAppropriate: true, reason: "Unable to analyze" };
    }
  }
};

export default GeminiService;