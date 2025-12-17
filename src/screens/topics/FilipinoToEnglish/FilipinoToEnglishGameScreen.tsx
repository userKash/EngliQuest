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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";


type FirestoreTranslationQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  clue?: string;
  status: string;
  level: string;
  interest: string;
  gameMode: string;
};

const QUIZ_KEY = (uid: string, levelId: string) =>
  `LOCKED_TRANSLATION_QUIZ_${uid}_${levelId}`;

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
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const normalized = String(levelId).replace(/^trans-/, "");
      const firestoreLevel = LEVEL_MAP[normalized];
      if (!firestoreLevel) return;

      const storageKey = QUIZ_KEY(user.uid, normalized);

      // 🔒 STEP 1: Load locked quiz if exists
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        const parsed: QA[] = JSON.parse(cached);
        setQuestions(parsed);
        setProgress({ current: 0, total: parsed.length });
        setLoading(false);
        return;
      }

      // 🔹 STEP 2: Fetch user interests
      const userSnap = await db
        .collection("users")
        .doc(user.uid)
        .get();

      const userData = userSnap.data();
      if (!userData?.interests?.length) return;

      const interests: string[] = userData.interests.slice(0, 3);
      const COLLECTION = "quiz_template_questions";
      const GAME_MODE = "Translation";
      const MAX_QUESTIONS = 15;

      let allQuestions: FirestoreTranslationQuestion[] = [];

      // =================================================
      // 🔵 React Native Firebase
      // =================================================
      if ("collection" in db) {
        for (const interest of interests) {
          const snap = await db
            .collection(COLLECTION)
            .where("interest", "==", interest)
            .where("level", "==", firestoreLevel)
            .where("gameMode", "==", GAME_MODE)
            .get();

          const approved = snap.docs
            .map(
              (doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
                doc.data() as FirestoreTranslationQuestion
            )
            .filter((q: { status: string; }) => q.status === "approved");

          allQuestions.push(...approved);
        }
      }

      // =================================================
      // 🟠 Web Firebase fallback
      // =================================================
      else {
        const { collection, query, where, getDocs } =
          await import("firebase/firestore");

        for (const interest of interests) {
          const q = query(
            collection(db, COLLECTION),
            where("interest", "==", interest),
            where("level", "==", firestoreLevel),
            where("gameMode", "==", GAME_MODE)
          );

          const snap = await getDocs(q);
          const approved = snap.docs
            .map(doc => doc.data() as FirestoreTranslationQuestion)
            .filter(q => q.status === "approved");

          allQuestions.push(...approved);
        }
      }

      // 🛑 SAFETY CHECK
      allQuestions = allQuestions.filter(
        q => q.gameMode === "Translation"
      );

      // 🔀 Shuffle ONCE
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [
          allQuestions[j],
          allQuestions[i],
        ];
      }

      // ✂️ Pick EXACTLY 15
      const finalQuestions: QA[] = allQuestions
        .slice(0, MAX_QUESTIONS)
        .map(q => ({
          filipino: q.question,
          note: q.explanation ?? "",
          accepts: q.options[q.correctIndex]
            ? [q.options[q.correctIndex]]
            : [],
        }));

      if (!finalQuestions.length) return;

      // 🔐 LOCK quiz
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(finalQuestions)
      );

      setQuestions(finalQuestions);
      setProgress({
        current: 0,
        total: finalQuestions.length,
      });

    } catch (err) {
      console.error("❌ Error loading translation quiz:", err);
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
