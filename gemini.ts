import { GoogleGenerativeAI } from "@google/generative-ai";
import db from "./node_scripts/firebase-admin.js";

// const GEMINI_API_KEY = "AIzaSyDAuUE91Dylc_wPOulknZBgGW--_YlZ_v4";
// const GEMINI_API_KEY = "AIzaSyBTiE1WIPRv-nKAwkTf7FitzLi5qbLnKcQ";
const GEMINI_API_KEY = "AIzaSyBEtS5_bpEgcJ9KBxdeu9bQzwzlwJ5KOa4"
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

function cleanJSONResponse(raw: string): string {
    return raw.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
}

function capitalizeFirstLetter(text: string): string {
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

function validateAndFormatQuestions(raw: string): Question[] {
    const cleaned = cleanJSONResponse(raw);
    let questions: Question[] = JSON.parse(cleaned);

    if (
        !Array.isArray(questions) ||
        !questions.every(
            q =>
                typeof q.question === "string" &&
                Array.isArray(q.options) &&
                q.options.length === 4 &&
                typeof q.correctIndex === "number" &&
                typeof q.explanation === "string"
        )
    ) {
        throw new Error("Invalid question format from Gemini API");
    }

    return questions.map(q => ({
        ...q,
        question: capitalizeFirstLetter(q.question),
        options: q.options.map(opt => capitalizeFirstLetter(opt)),
        explanation: capitalizeFirstLetter(q.explanation),
    }));
}

function getLevelDescription(level: CEFRLevel): string {
    switch (level) {
        case "A1": return "Beginner (Elementary English learners)";
        case "A2": return "Elementary (Pre-intermediate English learners)";
        case "B1": return "Threshold (Intermediate English learners)";
        case "B2": return "Vantage (Upper-intermediate English learners)";
        case "C1": return "Effective Operational Proficiency (Advanced English learners)";
        case "C2": return "Mastery (Proficient English users)";
    }
}

function getLevelGuidelines(level: CEFRLevel): string {
    switch (level) {
        case "A1": return "simple grammar, everyday words, short explanations";
        case "A2": return "slightly more complex grammar, basic connectors, everyday contexts";
        case "B1": return "intermediate grammar, common idioms, workplace/school contexts, more detail in explanations";
        case "B2": return "upper-intermediate grammar, academic/workplace vocabulary, longer explanations with nuance";
        case "C1": return "advanced grammar, complex idioms, academic and professional vocabulary, nuanced explanations";
        case "C2": return "near-native proficiency, highly precise vocabulary, academic/technical contexts, very detailed explanations";
    }
}

function vocabularyPrompt(
    level: CEFRLevel,
    interests: string[],
    gameMode: string,
    difficulty: string
): string {
    return `
        You are a quiz creator for EngliQuest, a mobile English learning app.

        Generate a quiz set of 15 multiple-choice questions in JSON format.

        Details:
        - Target Level: ${level} (${getLevelDescription(level)})
        - Game Mode: ${gameMode}
        - Difficulty: ${difficulty}
        - Interests: ${interests.join(", ")}

        Vocabulary Focus:
        - Vocabulary refers to a learner’s understanding and correct use of words.
        - Questions must test vocabulary in context, where learners choose the correct word to complete a sentence.
        - Use context clues (e.g., contrast, definition, or example clues) to guide learners.
        - All sentences and words should be appropriate for ${level} level learners: ${getLevelGuidelines(level)}.

        Rules:
        1. Each question must be directly connected to the user’s interests listed above.
        2. Each question must present a short sentence with one missing word, requiring the learner to select the correct word.
        3. Provide exactly 4 answer options per question.
        4. For each question, set "correctIndex" to the 0-based index of the correct option.
        5. Include a short and simple explanation that shows why the correct option fits the context.
        6. Return only valid JSON, no extra text or formatting.

        Example JSON:
        [
            {
                "question": "She was tired, ___ she went to bed early.",
                "options": ["but", "so", "because", "and"],
                "correctIndex": 1,
                "explanation": "The word 'so' shows the result of being tired."
            }
        ]
    `;
}

function grammarPrompt(
    level: CEFRLevel,
    interests: string[],
    gameMode: string,
    difficulty: string
): string {
    return `
        You are a grammar quiz creator for EngliQuest, a mobile English learning app.

        Generate a quiz set of 15 multiple-choice questions in JSON format.

        Details:
        - Target Level: ${level} (${getLevelDescription(level)})
        - Focus: Grammar
        - Difficulty: ${difficulty}
        - Interests: ${interests.join(", ")}

        Grammar Focus:
        - Grammar is the way words are put together to make correct sentences.
        - Activities: Fill-in-the-blank and Error Spotting.
        - Target common grammar issues like subject-verb agreement, tense usage, and misuse/omission of verbs.
        - Learners should practice identifying and correcting errors.

        Rules:
        1. Each question must be either:
            - A sentence with a blank (fill-in-the-blank), or
            - A sentence with a grammar error (error spotting).
        2. Provide exactly 4 answer options per question.
        3. For each question, set "correctIndex" to the 0-based index of the correct option.
        4. Include a short and simple explanation showing why the correct answer is correct and, if applicable, what the error was.
        5. Each question must still tie back to the learner’s interests when possible.
        6. Return only valid JSON, no extra text or formatting.

        Example JSON:
        [
            {
                "question": "He ___ to the market yesterday.",
                "options": ["go", "goes", "went", "gone"],
                "correctIndex": 2,
                "explanation": "The past tense of 'go' is 'went'."
            },
            {
                "question": "She don't like apples.",
                "options": ["Correct as is", "She doesn't likes apples", "She doesn't like apples", "She not like apples"],
                "correctIndex": 2,
                "explanation": "The correct form is 'She doesn't like apples'."
            }
        ]
    `;
}

function translationPrompt(
    level: CEFRLevel,
    interests: string[],
    gameMode: string,
    difficulty: string  
): string {
    return `
    You are a translation quiz creator for EngliQuest, a mobile English learning app.

    Generate a quiz set of 15 multiple-choice questions in JSON format.

    Details:
    - Target Level: ${level} (${getLevelDescription(level)})
    - Focus: Translation (Filipino → English)
    - Difficulty: ${difficulty}
    - Interests: ${interests.join(", ")}

    Translation Focus:
    - Learners must translate **Filipino words or short phrases into English**.
    - Activities: Word or short-phrase translation (input-based recall).
    - Encourage bilingual development by reinforcing both Filipino and English.
    - Questions should still connect to the learner’s interests when possible.

    Rules:
    1. Each question must provide a Filipino word or phrase, and the learner chooses the correct English equivalent.
    2. Provide exactly 4 answer options per question.
    3. For each question, set "correctIndex" to the 0-based index of the correct option.
    4. Include a short explanation that shows why the correct English translation is correct.
    5. Keep translations age-appropriate and aligned with everyday vocabulary.

    Example JSON:
    [
        {
        "question": "Translate to English: 'Aso'",
        "options": ["Cat", "Dog", "Bird", "Fish"],
        "correctIndex": 1,
        "explanation": "'Aso' means 'Dog' in English."
        },
        {
        "question": "Translate to English: 'Maganda'",
        "options": ["Ugly", "Beautiful", "Small", "Big"],
        "correctIndex": 1,
        "explanation": "'Maganda' means 'Beautiful' in English."
        }
    ]
    `;
}

function sentenceConstructionPrompt(
  level: CEFRLevel,
  interests: string[],
  gameMode: string,
  difficulty: string
): string {
  return `
    You are a quiz creator for EngliQuest, a mobile English learning app.

    Generate a quiz set of 15 multiple-choice questions in **strict JSON format only**.
    Do not include explanations, notes, markdown, or code fences outside of JSON.

    Details:
    - Target Level: ${level} (${getLevelDescription(level)})
    - Game Mode: ${gameMode}
    - Difficulty: ${difficulty}
    - Interests: ${interests.join(", ")}

    Sentence Construction Focus:
    - A sentence is a grammatically complete string of words expressing a complete thought.
    - Learners often struggle with verb tenses, capitalization, and punctuation errors.
    - Sentence Construction mode presents jumbled words that learners must rearrange into grammatically correct sentences.
    - This helps learners improve syntax, word order, and logical flow of English grammar.

    Rules:
    1. Each question must provide a string like: "Rearrange the words: ['word1', 'word2', ...]".
    2. Provide exactly 4 answer options: each option should be a possible sentence arrangement.
    3. Only one option should be grammatically correct.
    4. Set "correctIndex" to the 0-based index of the correct option.
    5. Add a short and simple "explanation" showing why the correct arrangement is correct.
    6. Each question must tie back to the learner’s interests when possible.
    7. Return valid JSON only. No trailing commas, no escape characters, no markdown.

    Example JSON:
    [
      {
        "question": "Rearrange the words: ['the', 'dog', 'brown', 'big', 'ran']",
        "options": [
          "The dog brown big ran.",
          "Big brown the dog ran.",
          "The big brown dog ran.",
          "Dog ran the big brown."
        ],
        "correctIndex": 2,
        "explanation": "The correct sentence is 'The big brown dog ran.' because adjectives should precede the noun in proper order."
      }
    ]
  `;
}

function readingComprehensionPrompt(
  level: CEFRLevel,
  interests: string[],
  gameMode: string,
  difficulty: string
): string {
  return `
    You are a quiz creator for EngliQuest, a mobile English learning app.

    Generate a quiz set of 15 reading comprehension questions in **strict JSON format only**.
    Do not include explanations, notes, markdown, or code fences outside of JSON.

    Details:
    - Target Level: ${level} (${getLevelDescription(level)})
    - Game Mode: ${gameMode}
    - Difficulty: ${difficulty}
    - Interests: ${interests.join(", ")}

    Reading Comprehension Focus:
    - Learners will read short passages tailored to their interests.
    - Passages must be simple, age-appropriate, and engaging for ${level} level: ${getLevelGuidelines(level)}.
    - Each passage should be 2–4 sentences long.
    - Questions should check understanding of main idea, details, inference, and "what happens next".

    Rules:
    1. Each item must contain:
       - "passage": a short story or text (2–4 sentences).
       - "question": a comprehension question about the passage.
       - "options": exactly 4 answer choices (multiple-choice only).
       - "correctIndex": the 0-based index of the correct option.
       - "explanation": a short reason why the correct answer is correct.
    2. Questions must tie back to the learner’s interests when possible.
    3. Return valid JSON only. No trailing commas, no escape characters, no markdown.

    Example JSON:
    [
      {
        "passage": "Anna loves basketball. She practices every afternoon after school.",
        "question": "What does Anna do after school?",
        "options": ["She studies math", "She plays basketball", "She goes shopping", "She cooks dinner"],
        "correctIndex": 1,
        "explanation": "The passage says Anna practices basketball after school."
      }
    ]
  `;
}

async function generateVocabularyQuiz(
    level: CEFRLevel,       
    interests: string[],
    gameMode: string,        
    difficulty: string       
): Promise<Question[]> {
    const prompt = vocabularyPrompt(level, interests, gameMode, difficulty);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        return validateAndFormatQuestions(rawText);
    } catch (err) {
        console.error(`[${level}VocabQuiz] Failed to parse Gemini response:`, err);
        throw new Error("Quiz generation failed. Please try again.");
    }
}

async function generateGrammarQuiz(
    level: CEFRLevel,
    interests: string[],
    gameMode: string, 
    difficulty: string
): Promise<Question[]> {
    const prompt = grammarPrompt(level, interests, gameMode, difficulty);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        return validateAndFormatQuestions(rawText);
    } catch (err) {
        console.error(`[${level}GrammarQuiz] Failed to parse Gemini response:`, err);
        throw new Error("Grammar quiz generation failed. Please try again.");
    }
}

async function generateTranslationQuiz(
    level: CEFRLevel,
    interests: string[],
    gameMode: string,
    difficulty: string
    ): Promise<Question[]> {
    const prompt = translationPrompt(level, interests, gameMode, difficulty);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        return validateAndFormatQuestions(rawText);
    } catch (err) {
        console.error(`[${level}TranslationQuiz] Failed to parse Gemini response:`, err);
        throw new Error("Translation quiz generation failed. Please try again.");
    }
}

async function generateSentenceQuiz(
  level: CEFRLevel,       
  interests: string[],
  gameMode: string,        
  difficulty: string       
): Promise<Question[]> {
  const prompt = sentenceConstructionPrompt(level, interests, gameMode, difficulty);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    return validateAndFormatQuestions(rawText);
  } catch (err) {
    console.error(`[${level}SentenceConstructionQuiz] Failed to parse Gemini response:`, err);
    throw new Error("Sentence Construction quiz generation failed. Please try again.");
  }
}

async function generateReadingComprehensionQuiz(
  level: CEFRLevel,
  interests: string[],
  gameMode: string,
  difficulty: string
): Promise<Question[]> {
  const prompt = readingComprehensionPrompt(level, interests, gameMode, difficulty);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    return validateAndFormatQuestions(rawText);
  } catch (err) {
    console.error(`[${level}ReadingComprehensionQuiz] Failed to parse Gemini response:`, err);
    throw new Error("Reading Comprehension quiz generation failed. Please try again.");
  }
}

// Exported wrappers
export function EasyLevel1VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("A1", interests, gameMode, "easy");
}

export function EasyLevel2VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("A2", interests, gameMode, "easy");
}

export function MediumLevel1VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("B1", interests, gameMode, "medium");
}

export function MediumLevel2VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("B2", interests, gameMode, "medium");
}
export function HardLevel1VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("C1", interests, gameMode, "hard");
}

export function HardLevel2VocabQuiz(interests: string[], gameMode: string) {
    return generateVocabularyQuiz("C2", interests, gameMode, "hard");
}

//Grammar
export function EasyLevel1GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("A1", interests, gameMode, "easy");
}

export function EasyLevel2GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("A2", interests, gameMode, "easy");
}

export function MediumLevel1GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("B1", interests, gameMode, "medium");
}

export function MediumLevel2GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("B2", interests, gameMode, "medium");
}

export function HardLevel1GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("C1", interests, gameMode, "hard");
}

export function HardLevel2GrammarQuiz(interests: string[], gameMode: string) {
    return generateGrammarQuiz("C2", interests, gameMode, "hard");
}

//Translation

export function EasyLevel1TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("A1", interests, gameMode, "easy");
}

export function EasyLevel2TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("A2", interests, gameMode, "easy");
}

export function MediumLevel1TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("B1", interests, gameMode, "medium");
}

export function MediumLevel2TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("B2", interests, gameMode, "medium");
}

export function HardLevel1TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("C1", interests, gameMode, "hard");
}

export function HardLevel2TranslationQuiz(interests: string[], gameMode: string) {
    return generateTranslationQuiz("C2", interests, gameMode, "hard");
}

//Sentence
export function EasyLevel1SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("A1", interests, gameMode, "easy");
}

export function EasyLevel2SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("A2", interests, gameMode, "easy");
}

export function MediumLevel1SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("B1", interests, gameMode, "medium");
}

export function MediumLevel2SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("B2", interests, gameMode, "medium");
}

export function HardLevel1SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("C1", interests, gameMode, "hard");
}
export function HardLevel2SentenceQuiz(interests: string[], gameMode: string) {
    return generateSentenceQuiz("C2", interests, gameMode, "hard");
}

//Reading Comprehension

export function EasyLevel1ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("A1", interests, gameMode, "easy");
}

export function EasyLevel2ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("A2", interests, gameMode, "easy");
}

export function MediumLevel1ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("B1", interests, gameMode, "medium");
}

export function MediumLevel2ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("B2", interests, gameMode, "medium");
}

export function HardLevel1ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("C1", interests, gameMode, "hard");
}

export function HardLevel2ReadingQuiz(interests: string[], gameMode: string) {
    return generateReadingComprehensionQuiz("C2", interests, gameMode, "hard");
}

export async function createPersonalizedQuiz(
    userId: string,
    level: CEFRLevel,
    interests: string[],
    gameMode: string,     
    difficulty: string,
    quiz?: Question[]       
): Promise<{ quizId: string; questions: Question[] }> {
    let questions: Question[];

    if (quiz) {
        // ✅ If caller already provides quiz, use it
        questions = quiz;
    } else {
        // ✅ Otherwise, generate based on gameMode
        if (gameMode === "Grammar") {
            questions = await generateGrammarQuiz(level, interests, gameMode, difficulty);
            } else if (gameMode === "Vocabulary") {
            questions = await generateVocabularyQuiz(level, interests, gameMode, difficulty);
            } else if (gameMode === "Sentence Construction") {
            questions = await generateSentenceQuiz(level, interests, gameMode, difficulty);
            } else if (gameMode === "Reading Comprehension") {
            questions = await generateReadingComprehensionQuiz(level, interests, gameMode, difficulty);
            } else if (gameMode === "Translation") {
            questions = await generateTranslationQuiz(level, interests, gameMode, difficulty);
            } else {
        throw new Error(`Unsupported game mode: ${gameMode}`);
        }
    }

    const quizRef = await db.collection("quizzes").add({
        userId,
        level,
        gameMode,
        difficulty,
        questions,
        createdAt: new Date(),
    });

    return { quizId: quizRef.id, questions };
}
