<<<<<<< HEAD
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
=======
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import InstructionCard from "../../../components/InstructionCard";
import ReadingQuiz from "../../../components/ReadingQuiz";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal"; // 👈 shared modal

export default function ReadingGameScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>(
    { current: 0, total: 1 }
  );
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4

  const [showExitModal, setShowExitModal] = useState(false);

  // ✅ Handle Android hardware back
  useEffect(() => {
    const backAction = () => {
      if (step === "quiz") {
        setShowExitModal(true);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [step]);

  // ✅ Handle navigation header
  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        gestureEnabled: false,
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
<<<<<<< HEAD
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Reading Comprehension</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {String(levelId).toUpperCase()} – Question {progress.current + 1} of {progress.total}
=======
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Comprehension Quiz
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              Question {progress.current + 1} of {progress.total}
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4
            </Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={{ marginLeft: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="arrow-back" size={24} />
          </TouchableOpacity>
        ),
      });
    } else {
<<<<<<< HEAD
      navigation.setOptions({ headerTitle: "Reading Comprehension" });
    }
  }, [step, progress, levelId]);
=======
      navigation.setOptions({
        gestureEnabled: true,
        headerTitle: "Reading Comprehension",
        headerLeft: undefined,
      });
    }
  }, [step, progress]);
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4

  const instructions = {
    title: "Reading Comprehension",
    body:
<<<<<<< HEAD
      "Read the passage carefully. Then answer the questions.\n\n" +
      "Choose the correct answer based on the passage.",
=======
      "Read the passage carefully. Then answer all questions on the next screen.\n\n" +
      "Answer the multiple-choice question based on what you read.",
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4
    tip: "Tip: Pay attention to details like who, what, where, and when!",
    titleIcon: require("../../../../assets/Reading Comprehension.png"),
    tipIcon: require("../../../../assets/flat-color-icons_idea.png"),
  };

<<<<<<< HEAD
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
=======
  const currentRoute = (navigation as any).getState().routes.slice(-1)[0].name;
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4

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
<<<<<<< HEAD
          nextLabel="Start Quiz"
=======
          nextLabel="Continue to Questions"
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4
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

      <ExitQuizModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          navigation.goBack();
        }}
      />

      <BottomNav
        currentRoute={currentRoute}
        onNavigate={(name) => navigation.navigate(name as never)}
        inQuiz={step === "quiz"}
        onBlockedNav={() => setShowExitModal(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
<<<<<<< HEAD
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
=======
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4
});
