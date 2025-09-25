import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import { initFirebase } from "../../../../firebaseConfig";

import InstructionCard from "../../../components/InstructionCard";
import ReadingQuiz from "../../../components/ReadingQuiz";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  passage?: string;
};

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

// Save quiz result both locally and to Firestore (scores collection)
async function saveReadingResult(subId: string, rawScore: number, total: number) {
  const user = auth().currentUser;
  if (!user) return;

  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const key = `ReadingProgress_${user.uid}`;
  const stored = await AsyncStorage.getItem(key);
  const progress = stored ? JSON.parse(stored) : {};

  const percentage = Math.round((rawScore / total) * 100);

  progress[subId] = {
    score: Math.max(progress[subId]?.score ?? 0, percentage),
    attempted: true,
  };

  await AsyncStorage.setItem(key, JSON.stringify(progress));
  console.log(`✅ Saved Reading ${percentage}% locally for ${subId}`);

  try {
    const { db } = await initFirebase();
    await db.collection("scores").add({
      userId: user.uid,
      levelId: subId,
      quizType: "Reading",
      score: percentage,
      totalscore: 100,
      createdAt: (await import("@react-native-firebase/firestore")).default.FieldValue.serverTimestamp(),
    });
    console.log("✅ Saved Reading score to Firestore");
  } catch (err) {
    console.warn("⚠️ Could not save reading score to Firestore:", err);
  }
}

export default function ReadingGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { levelId } = route.params; // e.g., "read-easy-1" or "easy-1"

  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 1 });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;
        const normalized = String(levelId).replace(/^read-/, "");
        const firestoreLevel = LEVEL_MAP[normalized];

        if (!firestoreLevel) {
          console.warn(`No mapping found for sublevel: ${normalized}`);
          return;
        }

        let snapshot;
        try {
          snapshot = await db
            .collection("quizzes")
            .where("userId", "==", uid)
            .where("level", "==", firestoreLevel)
            .where("gameMode", "==", "Reading Comprehension")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        } catch (err: any) {
          if (String(err.message).includes("failed-precondition")) {
            // fallback without orderBy (avoids index requirement)
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", uid)
              .where("level", "==", firestoreLevel)
              .where("gameMode", "==", "Reading Comprehension")
              .limit(1)
              .get();
          } else {
            throw err;
          }
        }

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const qArr = Array.isArray(data.questions) ? data.questions : [];
          // ensure each question has the expected keys from Firestore object
          const normalizedQuestions: Question[] = qArr.map((q: any) => ({
            question: q.question ?? "",
            options: Array.isArray(q.options) ? q.options : [],
            correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
            explanation: q.explanation ?? "",
            passage: q.passage ?? "",
          }));
          setQuestions(normalizedQuestions);
          setProgress({ current: 0, total: normalizedQuestions.length || 1 });
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error("❌ Error fetching reading quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [levelId]);

  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Reading Comprehension</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {String(levelId).toUpperCase()} – Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: "Reading Comprehension" });
    }
  }, [step, progress, levelId]);

  const instructions = {
    title: "Reading Comprehension",
    body:
      "Read the passage carefully. Then answer the questions.\n\n" +
      "Choose the correct answer based on the passage.",
    tip: "Tip: Pay attention to details like who, what, where, and when!",
    titleIcon: require("../../../../assets/Reading Comprehension.png"),
    tipIcon: require("../../../../assets/flat-color-icons_idea.png"),
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!questions.length) {
    return (
      <View style={styles.center}>
        <Text>No reading quiz found for {String(levelId)}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {step === "instructions" ? (
        <InstructionCard
          title={instructions.title}
          body={instructions.body}
          tip={instructions.tip}
          titleIcon={instructions.titleIcon}
          tipIcon={instructions.tipIcon}
          onNext={() => setStep("quiz")}
          nextLabel="Start Quiz"
        />
      ) : (
        <ReadingQuiz
          // pass the questions in the shape ReadingQuiz expects
          questions={questions.map((q) => ({
            prompt: q.question,
            choices: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            passage: q.passage,
          }))}
          passageTitle="Passage"
          onProgressChange={(p) => setProgress(p)}
          onFinish={async (rawCorrectCount: number) => {
            await saveReadingResult(levelId, rawCorrectCount, questions.length);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
