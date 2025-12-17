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
import { useMusic } from "../../../context/MusicContext";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clue?: string;
};

type FirestoreQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clue?: string;
  status: "approved" | "pending";
  questionIndex: number;
  interest: string;
  level: string;
  gameMode: string;
};

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

const QUIZ_KEY = (uid: string, levelId: string) =>
  `LOCKED_VOCAB_QUIZ_${uid}_${levelId}`;


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

  const { setMode } = useMusic();
    useEffect(() => {
    setMode("quiz"); 

    return () => {
      setMode("home"); 
    };
  }, []);


  // Handle Android hardware back
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

  // Handle navigation header
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
            Vocabulary Builder
          </Text>
          <Text style={{ fontSize: 14, color: "#555" }}>
            Read the instructions carefully
          </Text>
        </View>
      ),
      headerLeft: undefined,
    });
  }
}, [step, progress, levelId]);


useEffect(() => {
  const loadQuiz = async () => {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const firestoreLevel = LEVEL_MAP[levelId];
      if (!firestoreLevel) return;

      const CACHE_KEY = QUIZ_KEY(user.uid, levelId);

      // ============================================
      // 1️⃣ ALWAYS CHECK STORED QUIZ FIRST
      // ============================================
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const savedQuestions: Question[] = JSON.parse(cached);
        setQuestions(savedQuestions);
        setProgress({ current: 0, total: savedQuestions.length });
        setLoading(false);
        return; // 🔒 STOP HERE — NEVER REGENERATE
      }

      // ============================================
      // 2️⃣ FETCH USER INTERESTS (ONLY ON FIRST TIME)
      // ============================================
      const userSnap = await db
        .collection("users")
        .doc(user.uid)
        .get();

      const userData = userSnap.data();
      if (!userData?.interests?.length) return;

      const interests: string[] = userData.interests.slice(0, 3);

      const COLLECTION = "quiz_template_questions";
      const GAME_MODE = "Vocabulary";
      const MAX_QUESTIONS = 15;

      let allQuestions: FirestoreQuestion[] = [];

      // ============================================
      // 3️⃣ FETCH QUESTIONS (VOCAB ONLY)
      // ============================================
      if ("collection" in db) {
        for (const interest of interests) {
          const snap = await db
            .collection(COLLECTION)
            .where("interest", "==", interest)
            .where("level", "==", firestoreLevel)
            .where("gameMode", "==", GAME_MODE)
            .get();

          allQuestions.push(
            ...snap.docs
              .map((doc: { data: () => FirestoreQuestion; }) => doc.data() as FirestoreQuestion)
              .filter((q: { status: string; }) => q.status === "approved")
          );
        }
      }

      // ============================================
      // 4️⃣ SHUFFLE ONCE (FOREVER)
      // ============================================
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [
          allQuestions[j],
          allQuestions[i],
        ];
      }

      const finalQuestions: Question[] = allQuestions
        .slice(0, MAX_QUESTIONS)
        .map(q => ({
          question: q.question,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          clue: q.clue,
        }));

      if (!finalQuestions.length) return;

      // ============================================
      // 5️⃣ LOCK QUIZ FOREVER
      // ============================================
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify(finalQuestions)
      );

      setQuestions(finalQuestions);
      setProgress({ current: 0, total: finalQuestions.length });

    } catch (err) {
      console.error("❌ Error loading locked vocabulary quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  loadQuiz();
}, [levelId]);







  const instructions = {
    title: "Vocabulary Builder",
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
          nextLabel="Start Quiz"
        />
      ) : (
        <VocabularyQuiz
          questions={questions.map((q) => ({
            prompt: q.question,
            choices: q.options,
            correctIndex: q.correctIndex,
            sentence: q.explanation,
            clue: q.clue ?? "",   
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
    backgroundColor: "#FFFFFF",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
