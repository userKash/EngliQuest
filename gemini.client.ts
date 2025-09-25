import { GoogleGenerativeAI } from "@google/generative-ai";

// --- CONFIG ---
const GEMINI_API_KEY = "AIzaSyDQc11ZcStQfUn6D-wSiZQNR6j7lwYRTW8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- TYPES ---
export interface Question {
  passage?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// --- HELPERS ---
function cleanJSONResponse(raw: string): string {
  return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
}

function sanitizeJSON(raw: string): string {
  let fixed = cleanJSONResponse(raw);

  // Merge back-to-back arrays
  fixed = fixed.replace(/\]\s*\[/g, ",");

  // Remove trailing commas before ] or }
  fixed = fixed.replace(/,\s*([}\]])/g, "$1");

  // Normalize curly quotes to straight quotes
  fixed = fixed.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  return fixed;
}

function capitalizeFirstLetter(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function extractQuestions(parsed: any): Question[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed?.quiz && Array.isArray(parsed.quiz)) return parsed.quiz;
  if (parsed?.questions && Array.isArray(parsed.questions)) return parsed.questions;
  return [];
}

function validateAndFormatQuestions(raw: string): Question[] {
  const cleaned = sanitizeJSON(raw);
  let parsed: any;

  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("❌ JSON parse failed. Raw Gemini output:", cleaned);

    // Try to recover: extract JSON-like block
    const matches = cleaned.match(/\[[\s\S]*\]/);
    if (matches) {
      try {
        const recovered = matches[0].replace(/,\s*([}\]])/g, "$1");
        parsed = JSON.parse(recovered);
      } catch (err2) {
        throw new Error("Gemini returned unrecoverable JSON");
      }
    } else {
      throw new Error("Gemini returned invalid JSON");
    }
  }

  const questions = extractQuestions(parsed);

  if (!Array.isArray(questions)) {
    console.error("❌ Gemini response is not an array:", parsed);
    throw new Error("Invalid quiz format from Gemini API");
  }

  // Final validation & cleanup
  return questions.map((q, idx) => {
    const normalizedQuestion = Array.isArray(q.question)
      ? q.question.join(" ")
      : q.question;

    if (
      typeof normalizedQuestion !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctIndex !== "number" ||
      typeof q.explanation !== "string"
    ) {
      console.error(`❌ Invalid format at question #${idx + 1}:`, q);
      throw new Error("Invalid question format from Gemini API");
    }

    return {
      ...q,
      question: capitalizeFirstLetter(normalizedQuestion),
      options: q.options.map((opt: string) => capitalizeFirstLetter(opt)),
      explanation: capitalizeFirstLetter(q.explanation),
    };
  });
}

// --- PROMPTS ---
function vocabularyPrompt(level: CEFRLevel, interests: string[], gameMode: string, difficulty: string): string {
  return `
    You are a quiz creator for EngliQuest.
    Generate a quiz set of 15 multiple-choice questions in JSON format ONLY.

    Level: ${level}
    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    - Each question must test vocabulary in context.
    - Provide exactly 4 options.
    - Include "question", "options", "correctIndex", "explanation".
    - Return a raw JSON array, no wrappers.
  `;
}

function grammarPrompt(level: CEFRLevel, interests: string[], gameMode: string, difficulty: string): string {
  return `
    You are a grammar quiz creator for EngliQuest.
    Generate a quiz set of 15 multiple-choice questions in JSON format ONLY.

    Level: ${level}
    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    - Each question is fill-in-the-blank or error spotting.
    - Provide exactly 4 options.
    - Include "question", "options", "correctIndex", "explanation".
    - Return a raw JSON array, no wrappers.
  `;
}

function translationPrompt(level: CEFRLevel, interests: string[], gameMode: string, difficulty: string): string {
  return `
    You are a translation quiz creator for EngliQuest.
    Generate a quiz set of 15 multiple-choice questions in JSON format ONLY.

    Level: ${level}
    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    - Question: Filipino word/phrase.
    - Options: 4 English translations.
    - Include "question", "options", "correctIndex", "explanation".
    - Return a raw JSON array, no wrappers.
  `;
}

function sentenceConstructionPrompt(level: CEFRLevel, interests: string[], gameMode: string, difficulty: string): string {
  return `
    You are a sentence construction quiz creator for EngliQuest.
    Generate a quiz set of 15 multiple-choice questions in JSON format ONLY.

    Level: ${level}
    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    - Provide a jumbled word list in the "question".
    - 4 sentence options, only one correct.
    - Include "question", "options", "correctIndex", "explanation".
    - Return a raw JSON array, no wrappers.
  `;
}

function readingComprehensionPrompt(level: CEFRLevel, interests: string[], gameMode: string, difficulty: string): string {
  return `
    You are a reading comprehension quiz creator for EngliQuest.
    Generate a quiz set of 15 questions in JSON format ONLY.

    Level: ${level}
    Game Mode: ${gameMode}
    Difficulty: ${difficulty}
    Interests: ${interests.join(", ")}

    Rules:
    - Each item must include: "passage" (2–4 sentences), "question", 4 "options", "correctIndex", "explanation".
    - Return a raw JSON array, no wrappers.
  `;
}

// --- GENERIC QUIZ GENERATOR ---
async function generateQuiz(
  level: CEFRLevel,
  interests: string[],
  gameMode: string,
  difficulty: string,
  promptBuilder: (level: CEFRLevel, interests: string[], gameMode: string, difficulty: string) => string
): Promise<Question[]> {
  const prompt = promptBuilder(level, interests, gameMode, difficulty);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    return validateAndFormatQuestions(rawText);
  } catch (err) {
    console.error(`[${level}-${gameMode}] Generation failed:`, err);
    throw new Error("Quiz generation failed");
  }
}

// --- GAME MODE WRAPPERS ---
export function generateVocabulary(level: CEFRLevel, interests: string[], difficulty: string) {
  return generateQuiz(level, interests, "Vocabulary", difficulty, vocabularyPrompt);
}
export function generateGrammar(level: CEFRLevel, interests: string[], difficulty: string) {
  return generateQuiz(level, interests, "Grammar", difficulty, grammarPrompt);
}
export function generateTranslation(level: CEFRLevel, interests: string[], difficulty: string) {
  return generateQuiz(level, interests, "Translation", difficulty, translationPrompt);
}
export function generateSentence(level: CEFRLevel, interests: string[], difficulty: string) {
  return generateQuiz(level, interests, "Sentence Construction", difficulty, sentenceConstructionPrompt);
}
export function generateReading(level: CEFRLevel, interests: string[], difficulty: string) {
  return generateQuiz(level, interests, "Reading Comprehension", difficulty, readingComprehensionPrompt);
}

// --- MASTER EXPORT ---
export async function createPersonalizedQuizClient(
  userId: string,
  level: CEFRLevel,
  interests: string[],
  gameMode: string,
  difficulty: string
): Promise<{ quizId: string; questions: Question[] }> {
  let questions: Question[];

  if (gameMode === "Vocabulary") {
    questions = await generateVocabulary(level, interests, difficulty);
  } else if (gameMode === "Grammar") {
    questions = await generateGrammar(level, interests, difficulty);
  } else if (gameMode === "Translation") {
    questions = await generateTranslation(level, interests, difficulty);
  } else if (gameMode === "Sentence Construction") {
    questions = await generateSentence(level, interests, difficulty);
  } else if (gameMode === "Reading Comprehension") {
    questions = await generateReading(level, interests, difficulty);
  } else {
    throw new Error(`Unsupported game mode: ${gameMode}`);
  }

  const quizId = `${userId}_${Date.now()}_${gameMode}`;
  return { quizId, questions };
}
