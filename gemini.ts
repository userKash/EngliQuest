import { GoogleGenerativeAI } from "@google/generative-ai";
import { initFirebase } from "./firebaseConfig";

export type WordData = {
  word: string;
  definition: string;
};

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("Missing EXPO_PUBLIC_GEMINI_API_KEY in .env.local");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function cleanJSONResponse(raw: string): string {
  return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
}


export function wordOfTheDayPrompt(seed: string): string {
  return `
    You are an English vocabulary assistant for EngliQuest.

    Generate the word of the day in strict JSON format only.

    Rules:
    1. Use the provided seed ("${seed}") so the same seed always produces the same word.
    2. Choose a real English word suitable for learners.
    3. Provide exactly one word and its definition.
    4. Keep definition simple and clear.
    5. Return VALID JSON ONLY.

    Example:
    {
      "word": "Serendipity",
      "definition": "The occurrence of events by chance in a happy or beneficial way."
    }
  `;
}

/**
 * Fetch or Generate Word of the Day
 */
export async function fetchWordOfTheDayFromGemini(userId: string): Promise<WordData> {
  const { db } = await initFirebase();
  const today = new Date().toDateString();
  const docId = `${userId}_${today}`;

  // 1. Check Firestore cached version
  try {
    const wordDoc = await db.collection("userDailyWords").doc(docId).get();

    if (wordDoc.exists()) {
      const data = wordDoc.data();
      return {
        word: data?.word,
        definition: data?.definition
      };
    }
  } catch (err) {
    console.log("Firestore read error:", err);
  }

  // 2. Generate new word
  const seed = `${userId}_${today}`;
  const prompt = wordOfTheDayPrompt(seed);

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = cleanJSONResponse(rawText);
    const wordData = JSON.parse(cleaned);

    if (!wordData.word || !wordData.definition) {
      throw new Error("Invalid word data structure");
    }

    // Cache result
    await db.collection("userDailyWords").doc(docId).set({
      word: wordData.word,
      definition: wordData.definition,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    });

    return wordData;
  } catch (err) {
    console.error("Gemini word generation error:", err);

    // Fallback word list
    const fallbackWords = [
      { word: "Serendipity", definition: "The occurrence of events by chance in a happy or beneficial way." },
      { word: "Ephemeral", definition: "Lasting for a very short time." },
      { word: "Resilience", definition: "The ability to recover quickly from difficulties." },
      { word: "Wanderlust", definition: "A strong desire to travel." },
      { word: "Nostalgia", definition: "A longing for the past." }
    ];

    const fallbackIndex = Math.abs(seed.charCodeAt(0)) % fallbackWords.length;
    return fallbackWords[fallbackIndex];
  }
}
