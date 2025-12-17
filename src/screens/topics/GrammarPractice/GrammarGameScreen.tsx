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
import AsyncStorage from "@react-native-async-storage/async-storage";
import auth from "@react-native-firebase/auth";

import InstructionCard from "../../../components/InstructionCard";
import GrammarQuiz from "../../../components/GrammarQuiz";
import { initFirebase } from "../../../../firebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal";
import { useMusic } from "../../../context/MusicContext";
import { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";


type Question = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clue?: string;
};

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};


type FirestoreQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  clue?: string;
  status: string;
  level: string;
  interest: string;
  gameMode: string;
};

const QUIZ_KEY = (uid: string, levelId: string) =>
  `LOCKED_GRAMMAR_QUIZ_${uid}_${levelId}`;

// Save quiz result
async function saveQuizResult(
  subId: string,
  rawScore: number,
  totalQuestions: number
) {
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
  console.log(` Saved ${percentage}% for ${subId}`);
}

export default function GrammarGameScreen() {
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


  //  Load grammar quiz from Firestore
 useEffect(() => {
  const loadQuiz = async () => {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const firestoreLevel = LEVEL_MAP[levelId];
      if (!firestoreLevel) return;

      const storageKey = QUIZ_KEY(user.uid, levelId);

      // 🔒 STEP 1: Try loading locked quiz
      const cached = await AsyncStorage.getItem(storageKey);
      if (cached) {
        const parsed: Question[] = JSON.parse(cached);
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
      const GAME_MODE = "Grammar";
      const MAX_QUESTIONS = 15;

      let allQuestions: FirestoreQuestion[] = [];

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
                doc.data() as FirestoreQuestion
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
            .map(doc => doc.data() as FirestoreQuestion)
            .filter(q => q.status === "approved");

          allQuestions.push(...approved);
        }
      }

      // 🛑 Safety
      allQuestions = allQuestions.filter(
        q => q.gameMode === "Grammar"
      );

      // 🔀 Shuffle ONCE
      for (let i = allQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allQuestions[i], allQuestions[j]] = [
          allQuestions[j],
          allQuestions[i],
        ];
      }

      // ✂️ Pick exactly 15
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

      // 🔐 Lock quiz
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(finalQuestions)
      );

      setQuestions(finalQuestions);
      setProgress({ current: 0, total: finalQuestions.length });

    } catch (err) {
      console.error("❌ Error loading grammar quiz:", err);
    } finally {
      setLoading(false);
    }
  };

  loadQuiz();
}, [levelId]);


  //  Handle Android hardware back
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

  //  Handle navigation header
useLayoutEffect(() => {
  if (step === "quiz") {
    navigation.setOptions({
      gestureEnabled: false,
      headerTitle: () => (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Grammar Practice
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
            Grammar Practice
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
      <GrammarQuiz
        questions={questions.map((q) => ({
          prompt: q.question,
          choices: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          clue: q.clue,
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
        onBlockedNav={() => setShowExitModal(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
