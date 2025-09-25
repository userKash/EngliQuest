import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import InstructionCard from "../../../components/InstructionCard";
import VocabularyQuiz from "../../../components/VocabularyQuiz";
import { initFirebase } from "../../../../firebaseConfig";
import ExitQuizModal from "../../../components/ExitQuizModal";
import BottomNav from "../../../components/BottomNav";
import { Ionicons } from "@expo/vector-icons";

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

async function saveQuizResult(
  subId: string,
  rawScore: number,
  totalQuestions: number
) {
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
  const { levelId } = route.params;
  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Vocabulary Practice
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {levelId.toUpperCase()} – Question {progress.current + 1} of{" "}
              {progress.total}
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
      navigation.setOptions({
        gestureEnabled: true,
        headerTitle: "Vocabulary Practice",
        headerLeft: undefined,
      });
    }
  }, [step, progress, levelId]);

  // ✅ Load quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;
        const firestoreLevel = LEVEL_MAP[levelId];

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
              where("level", "==", firestoreLevel),
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

  const currentRoute = (navigation as any).getState().routes.slice(-1)[0].name;

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
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
