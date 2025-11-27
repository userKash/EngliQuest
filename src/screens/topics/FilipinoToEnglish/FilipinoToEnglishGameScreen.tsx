import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import { initFirebase } from "../../../../firebaseConfig";

import InstructionCard from "../../../components/InstructionCard";
import FilipinoToEnglishQuiz from "../../../components/FilipinoToEnglishQuiz";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal";
import { useMusic } from "../../../context/MusicContext";

type FirestoreQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  clue?: string;
};

type QA = {
  filipino: string;
  note?: string;
  accepts: string[];
};

// Map Firestore levels
const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

// Save quiz result (local + Firestore)
async function saveTranslationResult(subId: string, percentage: number) {
  const user = auth().currentUser;
  if (!user) return;

  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const key = `TranslationProgress_${user.uid}`;
  const stored = await AsyncStorage.getItem(key);
  const progress = stored ? JSON.parse(stored) : {};

  const finalPct = Math.min(100, Math.max(0, Math.round(percentage)));

  progress[subId] = {
    score: Math.max(progress[subId]?.score ?? 0, finalPct),
    attempted: true,
  };

  await AsyncStorage.setItem(key, JSON.stringify(progress));
  console.log(` Saved Translation ${finalPct}% locally for ${subId}`);

  try {
    const { db } = await initFirebase();
    await db.collection("scores").add({
      userId: user.uid,
      levelId: subId,
      quizType: "Translation",
      score: finalPct,
      totalscore: 100,
      createdAt: (
        await import("@react-native-firebase/firestore")
      ).default.FieldValue.serverTimestamp(),
    });
    console.log(" Saved Translation score to Firestore");
  } catch (err) {
    console.warn(" Could not save Translation score to Firestore:", err);
  }
}

export default function FilipinoToEnglishGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { levelId } = route.params; // e.g., "trans-easy-1"

  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });
  const [questions, setQuestions] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);

  const { setMode, setShouldPlay } = useMusic();
  
  useEffect(() => {
    setShouldPlay(true);
    setMode("quiz");  
  
    return () => {
      setMode("home"); 
    };
  }, []);

  // Load quiz
  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;
        const normalized = String(levelId).replace(/^trans-/, "");
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
            .where("gameMode", "==", "Translation")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        } catch (err: any) {
          if (String(err.message).includes("failed-precondition")) {
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", uid)
              .where("level", "==", firestoreLevel)
              .where("gameMode", "==", "Translation")
              .limit(1)
              .get();
          } else {
            throw err;
          }
        }

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          const qArr: FirestoreQuestion[] = Array.isArray(data.questions)
            ? data.questions
            : [];

          const normalizedQuestions: QA[] = qArr.map((q) => ({
            filipino: q.question,
            note: q.explanation ?? "",
            clue: q.clue ?? "", 
            accepts: q.options[q.correctIndex] ? [q.options[q.correctIndex]] : [],
          }));

          setQuestions(normalizedQuestions);
          setProgress({ current: 0, total: normalizedQuestions.length || 1 });
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error("Error fetching translation quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [levelId]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (step === "quiz") {
        setShowExitModal(true);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [step]);

  // Handle navigation header
  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        gestureEnabled: false,
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Translation Practice
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {levelId.toUpperCase()} – Question {progress.current + 1} of {progress.total}
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
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Filipino to English
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              Read the instructions carefully
            </Text>
          </View>
        ),
        headerLeft: undefined,
      });
    }
  }, [step, progress, levelId]);

  const instructions = {
    title: "Filipino to English",
    body:
      "Instruction:\n\n" +
      "Read the Filipino word or short phrase.\n\n" +
      "Type its correct English translation.\n\n" +
      "Answers must be spelled correctly to be marked correct.",
    tip: "Tip: Think of common English phrases. No need for full sentences!",
    titleIcon: require("../../../../assets/Filipino to English.png"),
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
        <Text>No translation quiz found for {String(levelId)}</Text>
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
          nextLabel="Start Quiz"
        />
      ) : (
      <FilipinoToEnglishQuiz
        questions={questions}
        onProgressChange={setProgress}
        onFinish={async (percentage: number) => {
          await saveTranslationResult(levelId, percentage);
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
