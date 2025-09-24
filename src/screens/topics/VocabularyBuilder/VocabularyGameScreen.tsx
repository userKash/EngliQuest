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
import { useNavigation } from "@react-navigation/native";
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

export default function VocabularyGameScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // 🚨 Exit warning modal
  const [showExitModal, setShowExitModal] = useState(false);

  // ✅ Handle Android hardware back
  useEffect(() => {
    const backAction = () => {
      if (step === "quiz") {
        setShowExitModal(true);
        return true; // block default back
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [step]);

  // ✅ Handle navigation header + disable iOS swipe back
  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        gestureEnabled: false, // disable swipe back on iOS
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Vocabulary Practice
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              Easy – Question {progress.current + 1} of {progress.total}
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
  }, [step, progress]);


  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const uid = user.uid;

        if (db.collection) {
          let snapshot;
          try {
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", uid)
              .orderBy("createdAt", "desc")
              .limit(1)
              .get();
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              snapshot = await db
                .collection("quizzes")
                .where("userId", "==", uid)
                .limit(1)
                .get();
            } else {
              throw err;
            }
          }
          if (!snapshot.empty) {
            const data = snapshot.docs[0].data();
            if (data.questions) setQuestions(data.questions);
          }
        } else {
          const {
            collection,
            query,
            where,
            orderBy,
            limit,
            getDocs,
          } = await import("firebase/firestore");

          let q;
          try {
            q = query(
              collection(db, "quizzes"),
              where("userId", "==", uid),
              orderBy("createdAt", "desc"),
              limit(1)
            );
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              q = query(
                collection(db, "quizzes"),
                where("userId", "==", uid),
                limit(1)
              );
            } else {
              throw err;
            }
          }

          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = snap.docs[0].data();
            if (data.questions) setQuestions(data.questions);
          }
        }
      } catch (err) {
        console.error("Error fetching quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, []);

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
        <Text>No quiz found.</Text>
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
        />
      )}

      <ExitQuizModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          navigation.goBack(); // exit quiz
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
