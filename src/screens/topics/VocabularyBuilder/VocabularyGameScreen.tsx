import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import InstructionCard from "../../../components/InstructionCard";
import VocabularyQuiz from "../../../components/VocabularyQuiz";
import { initFirebase } from "../../../../firebaseConfig";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};


const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

async function saveQuizResult(subId: string, rawScore: number, totalQuestions: number) {
  const user = auth().currentUser;
  if (!user) return;

  const key = `VocabularyProgress_${user.uid}`;
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

export default function VocabularyGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { levelId } = route.params; // 👈 comes from GrammarPracticeScreen
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
        const firestoreLevel = LEVEL_MAP[levelId]; // 👈 map easy-2 → A2

        if (!firestoreLevel) {
          console.warn(`No mapping found for sublevel: ${levelId}`);
          return;
        }

        if (db.collection) {
          // Firestore v8
          let snapshot;
          try {
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", uid)
              .where("level", "==", firestoreLevel)
              .orderBy("createdAt", "desc")
              .limit(1)
              .get();
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              snapshot = await db
                .collection("quizzes")
                .where("userId", "==", uid)
                .where("level", "==", firestoreLevel)
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
        } else {
          // Firestore v9
          const { collection, query, where, orderBy, limit, getDocs } =
            await import("firebase/firestore");

          let q;
          try {
            q = query(
              collection(db, "quizzes"),
              where("userId", "==", uid),
              where("level", "==", firestoreLevel), // 👈 dynamic level
              orderBy("createdAt", "desc"),
              limit(1)
            );
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              q = query(
                collection(db, "quizzes"),
                where("userId", "==", uid),
                where("level", "==", firestoreLevel),
                limit(1)
              );
            } else throw err;
          }

          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            if (data.questions) {
              setQuestions(data.questions);
              setProgress({ current: 0, total: data.questions.length });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
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
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Vocabulary Practice</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {levelId.toUpperCase()} – Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: "Vocabulary Practice" });
    }
  }, [step, progress, levelId]);

  const instructions = {
    title: "Vocabulary Practice",
    body:
      "Instruction:\n\n" +
      "Read each question carefully and select the correct meaning or usage of the given word.\n\n" +
      "Focus on word context, synonyms, and correct spelling.\n\n" +
      "Only one choice is correct.",
    tip: "Think about how the word is used in a sentence before choosing.",
    titleIcon: require("../../../../assets/Vocabulary Builder.png"),
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
        <Text>No quiz found for {levelId}</Text>
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
        <VocabularyQuiz
          questions={questions.map((q) => ({
            prompt: q.question,
            choices: q.options,
            correctIndex: q.correctIndex,
            sentence: q.explanation,
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
