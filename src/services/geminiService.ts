import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getPerformanceInsights(results: any) {
  try {
    const prompt = `Analyze these employee exam results and provide a brief, professional, and futuristic advice (cybersecurity style) for improvement.
    Results: ${JSON.stringify(results)}
    Keep it concise and in Arabic as the app is for Arabic speakers but with a futuristic tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are a cyber-security evaluation AI. Your tone is serious, efficient, and technical. You provide high-level insights for employee performance."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "خطأ في تحليل البيانات. تأكد من اتصالك بالنظام.";
  }
}
