// gemini.client.ts (Expo safe)
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initFirebase } from "./firebaseConfig";

const GEMINI_API_KEY = "AIzaSyDAuUE91Dylc_wPOulknZBgGW--_YlZ_v4";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function cleanJSONResponse(raw: string): string {
  return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
}

export async function generateQuiz(
  interests: string[],
  gameMode: string,
  difficulty: string
): Promise<Question[]> {
  const prompt = `
    Generate 5 multiple-choice quiz questions in JSON format.

    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    1. Each question must be directly related to the user's interests listed above.
    2. Provide JSON only, no extra text.
    3. Each question must have 4 options.
    4. For each question, set "correctIndex" to the 0-based index of the correct answer in the options array.
    5. Include a brief explanation of the correct answer.
  `;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(prompt);

  const rawText = result.response.text();
  const cleaned = cleanJSONResponse(rawText);
  return JSON.parse(cleaned);
}

export async function createPersonalizedQuizClient(
  userId: string,
  interests: string[],
  gameMode: string,
  difficulty: string
): Promise<{ quizId: string; questions: Question[] }> {
  const questions = await generateQuiz(interests, gameMode, difficulty);

  const { db } = await initFirebase();

  const quizId = `${userId}_${Date.now()}`;

  if (db.collection) {
    // RNFirebase
    await db.collection("quizzes").doc(quizId).set({
      quizId,
      userId,
      gameMode,
      difficulty,
      questions,
      createdAt: new Date().toISOString(),
    });
  } else {
    // Firestore Web SDK
    const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
    await setDoc(doc(db, "quizzes", quizId), {
      quizId,
      userId,
      gameMode,
      difficulty,
      questions,
      createdAt: serverTimestamp(),
    });
  }

  return { quizId, questions };
}

