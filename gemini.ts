import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "./firebase-admin.js";

const GEMINI_API_KEY = "AIzaSyDAuUE91Dylc_wPOulknZBgGW--_YlZ_v4";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Type definitions
export interface Question {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface Quiz {
    userId: string;
    gameMode: string;
    difficulty: string;
    questions: Question[];
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

        Example JSON:
        [
            {
                "question": "string",
                "options": ["option1", "option2", "option3", "option4"],
                "correctIndex": 0,
                "explanation": "string explaining the correct answer"
            }
        ]
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); //if error 503, just change the model
    const result = await model.generateContent(prompt);

    try {
        const rawText = result.response.text();
        const cleaned = cleanJSONResponse(rawText);
        const questions: Question[] = JSON.parse(cleaned);

        if (!Array.isArray(questions)) throw new Error("Invalid JSON: not an array");
        for (const q of questions) {
            if (
                typeof q.question !== "string" ||
                !Array.isArray(q.options) ||
                typeof q.correctIndex !== "number" ||
                typeof q.explanation !== "string"
            ) {
                throw new Error("Invalid question format from Gemini API");
            }
        }
        return questions;
    } catch (err) {
        console.error("Error parsing Gemini response:", err);
        throw err;
    }
}

// store in Firestore
export async function createPersonalizedQuiz(
    userId: string,
    interests: string[],
    gameMode: string,
    difficulty: string
): Promise<{ quizId: string; questions: Question[] }> {
    const questions = await generateQuiz(interests, gameMode, difficulty);

    const quizRef = await db.collection("quizzes").add({
        userId,
        gameMode,
        difficulty,
        questions,
        createdAt: new Date(),
    });

    return { quizId: quizRef.id, questions };
}
