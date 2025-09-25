import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import InstructionCard from "../../../components/InstructionCard";
import GrammarQuiz from "../../../components/GrammarQuiz";
import { initFirebase } from "../../../../firebaseConfig";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

const PASSING = 70;

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

// Save quiz progress
async function saveQuizResult(subId: string, rawScore: number, totalQuestions: number) {
  const user = auth().currentUser;
  if (!user) return;

  const key = `GrammarProgress_${user.uid}`;
  const stored = await AsyncStorage.getItem(key);
  const progress = stored ? JSON.parse(stored) : {};

  const correctAnswers = rawScore / 10;
  const percentage = Math.round((correctAnswers / totalQuestions) * 100);

  progress[subId] = {
    score: Math.max(progress[subId]?.score ?? 0, percentage),
    attempted: true,
  };

  await AsyncStorage.setItem(key, JSON.stringify(progress));
  console.log(`✅ Saved ${percentage}% for ${subId}`);
}

export default function GrammarGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { levelId } = route.params; // e.g., "easy-1"
  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;
        const firestoreLevel = LEVEL_MAP[levelId];

        if (!firestoreLevel) {
          console.warn(`No mapping found for levelId: ${levelId}`);
          return;
        }

        // Exact same query pattern as VocabularyGameScreen
        let snapshot;
        try {
          snapshot = await db
            .collection("quizzes")
            .where("userId", "==", uid)
            .where("level", "==", firestoreLevel)
            .where("gameMode", "==", "Grammar") // filter grammar
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        } catch (err: any) {
          // fallback if index not available
          if (String(err.message).includes("failed-precondition")) {
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", uid)
              .where("level", "==", firestoreLevel)
              .where("gameMode", "==", "Grammar")
              .limit(1)
              .get();
          } else throw err;
        }

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.questions) {
            setQuestions(data.questions);
            setProgress({ current: 0, total: data.questions.length });
          }
        }
      } catch (err) {
        console.error("Error fetching grammar quiz:", err);
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
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Grammar Practice</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {levelId.toUpperCase()} – Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: "Grammar Practice" });
    }
  }, [step, progress, levelId]);

  const instructions = {
    title: "Grammar Practice",
    body:
      "Instruction:\n\n" +
      "Read each question carefully and select the correct grammar choice.\n\n" +
      "Focus on verb forms, tenses, and sentence structure.\n\n" +
      "Only one choice is correct.",
    tip: "Think carefully before choosing the answer.",
    titleIcon: require("../../../../assets/Grammar Practice.png"),
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
        <Text>No grammar quiz found for {levelId}</Text>
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
        />
      ) : (
        <GrammarQuiz
          questions={questions.map((q) => ({
            prompt: q.question,
            choices: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
          }))}
          onProgressChange={setProgress}
          onFinish={async (rawScore: number) => {
            await saveQuizResult(levelId, rawScore, questions.length);
            navigation.goBack();
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
