import db from "./firebase-admin.js";
import { createPersonalizedQuiz } from "../gemini.ts"; 

async function runUserQuiz(userId: string) {
try {
    const userSnap = await db.collection("users").doc(userId).get();
    if (!userSnap.exists) {
    console.log("User not found:", userId);
    return;
    }

    const userData = userSnap.data();
    const interests: string[] = userData?.interests || [];
    console.log(`User ${userId} interests:`, interests);

    if (interests.length === 0) {
    console.log("User has no interests saved!");
    return;
    }

    const { quizId, questions } = await createPersonalizedQuiz(
    userId,
    interests,
    "Vocabulary",
    "Easy"
    );

    console.log("Quiz created for user:", userId);
    console.log("Quiz ID:", quizId);
    questions.forEach((q, i) => {
    console.log(`\nQuestion ${i + 1}: ${q.question}`);
    q.options.forEach((opt, j) => console.log(`  ${j}: ${opt}`));
    console.log(`Correct Index: ${q.correctIndex}`);
    console.log(`Explanation: ${q.explanation}`);
    });

    } catch (err) {
    console.error("Error generating quiz for user:", err);
    }
}

runUserQuiz("sjWeQKukwXXuOULjzoQGoyOdGmz2");