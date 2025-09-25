// src/components/VocabularyQuiz.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import PrimaryButton from "./PrimaryButton";
import ResultModal from "../components/ResultModal";
import { initFirebase } from "../../firebaseConfig";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen"; // ✅ exported in ProgressScreen
import type { RootStackParamList } from "../navigation/type";

const STORAGE_KEY = "VocabularyProgress";

type VocabQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  sentence?: string;
};

type Props = {
  questions: VocabQuestion[];
  onFinish?: (finalScore: number, totalQuestions: number) => void;
  onProgressChange?: (p: { current: number; total: number }) => void;
};

export default function VocabularyQuiz({
  questions,
  onFinish,
  onProgressChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { levelId } = route.params; // "easy" | "med" | "hard"

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>(
    Array(questions.length).fill(-1)
  );
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // newly unlocked badge handling
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const choiceLabels = ["A", "B", "C", "D"];
  const question = questions[qIndex];
  const last = qIndex === questions.length - 1;

  useEffect(() => {
    onProgressChange?.({ current: qIndex, total: questions.length });
  }, [qIndex]);

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);

    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = i;
      return copy;
    });

    if (i === question.correctIndex) setScore((p) => p + 10);
  };

  // --- keep badgeModal in sync with newBadges ---
  useEffect(() => {
    if (newBadges.length > 0) {
      const normalized = newBadges[0].replace(/-\d+$/, "");
      console.log("🎯 Opening badge modal for:", normalized);
      setBadgeModal(normalized);
    } else {
      setBadgeModal(null);
    }
  }, [newBadges]);

  async function saveProgress(finalScore: number, totalQuestions: number) {
    try {
      const correctAnswers = finalScore / 10;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let progress = stored ? JSON.parse(stored) : {};

      progress[levelId] = {
        score: Math.max(progress[levelId]?.score ?? 0, percentage),
        attempted: true,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      console.log("✅ Progress saved locally:", progress);

      // unlock badge(s)
      const unlocked = await unlockBadge("vocab", levelId, progress);
      if (unlocked.length > 0) {
        setNewBadges(unlocked); // triggers useEffect → opens modal
      }
    } catch (err) {
      console.error("❌ Error saving progress:", err);
    }
  }

  async function saveScoreToFirestore(
    finalScore: number,
    totalQuestions: number
  ) {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const correctAnswers = finalScore / 10;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      let userName = "Anonymous";
      if (db.collection) {
        const docSnap = await db.collection("users").doc(uid).get();
        if (docSnap.exists) {
          userName = docSnap.data().name || "Anonymous";
        }
      } else {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          userName = (userDoc.data() as any).name || "Anonymous";
        }
      }

      if (db.collection) {
        const firestore =
          (await import("@react-native-firebase/firestore")).default;
        await db.collection("scores").add({
          userId: uid,
          userName,
          quizType: "Vocabulary",
          difficulty: levelId,
          userscore: percentage,
          totalscore: 100,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const { collection, addDoc, serverTimestamp } = await import(
          "firebase/firestore"
        );
        await addDoc(collection(db, "scores"), {
          userId: uid,
          userName,
          quizType: "Vocabulary",
          difficulty: levelId,
          userscore: percentage,
          totalscore: 100,
          createdAt: serverTimestamp(),
        });
      }

      console.log(
        `✅ Score saved to Firestore: ${percentage}% for user ${userName}`
      );
    } catch (err) {
      console.error("❌ Error saving score:", err);
    }
  }

  const handleNext = () => {
    if (!last) {
      setQIndex((p) => p + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      const finalScore = score;
      saveProgress(finalScore, questions.length);
      saveScoreToFirestore(finalScore, questions.length);
      onFinish?.(finalScore, questions.length);
    }
  };

  const review = useMemo(
    () =>
      questions.map((q, i) => {
        const your = answers[i];
        return {
          question: q.prompt,
          yourAnswer: your >= 0 ? q.choices[your] : "—",
          isCorrect: your === q.correctIndex,
          correctAnswer: q.choices[q.correctIndex],
        };
      }),
    [answers]
  );

  // --- handle continue after badges ---
  const handleBadgeContinue = () => {
    if (newBadges.length > 1) {
      const [, ...rest] = newBadges;
      setNewBadges(rest); // useEffect opens next badge
    } else {
      setNewBadges([]);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" as keyof RootStackParamList }],
      });
    }
  };

  const badgeData = badgeModal
    ? BADGES.find((b: { id: string }) => b.id === badgeModal)
    : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {question.sentence ? (
            <Text style={styles.sentence}>{question.sentence}</Text>
          ) : null}
          <Text style={styles.prompt}>{question.prompt}</Text>

          {question.choices.map((choice, i) => {
            const correct = question.correctIndex === i;
            const isSelected = selected === i;

            let choiceStyle = styles.choice;
            if (selected !== null) {
              if (correct)
                choiceStyle = { ...choiceStyle, ...styles.correctChoice };
              else if (isSelected)
                choiceStyle = { ...choiceStyle, ...styles.wrongChoice };
            }

            return (
              <TouchableOpacity
                key={i}
                style={choiceStyle}
                onPress={() => handleSelect(i)}
                disabled={selected !== null}
              >
                <Text style={styles.choiceLabel}>{choiceLabels[i]}</Text>
                <Text style={styles.choiceText}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selected !== null && (
          <View
            style={[
              styles.feedbackContainer,
              selected === question.correctIndex
                ? styles.feedbackCorrect
                : styles.feedbackWrong,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                selected === question.correctIndex
                  ? styles.feedbackTextCorrect
                  : styles.feedbackTextWrong,
              ]}
            >
              {selected === question.correctIndex
                ? "✅ Correct! +10 points"
                : "❌ Incorrect"}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {selected !== null && (
        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}
        >
          <PrimaryButton
            label={last ? "Finish" : "Next Question"}
            onPress={handleNext}
          />
        </View>
      )}

      <ResultModal
        visible={showResult}
        score={score / 10}
        total={questions.length}
        review={review}
        onRequestClose={() => setShowResult(false)}
        title="🎉 Congratulations!"
        onContinue={() => {
          setShowResult(false);
          setTimeout(() => {
            console.log("👉 Continue pressed. newBadges:", newBadges);
            if (newBadges.length === 0) {
              console.log("🏠 Navigating home, no badges.");
              navigation.reset({
                index: 0,
                routes: [{ name: "Home" as keyof RootStackParamList }],
              });
            }
          }, 300);
        }}
      />

      <Modal
        visible={!!badgeData}
        transparent
        animationType="fade"
        onRequestClose={handleBadgeContinue}
      >
        <Pressable style={styles.overlay} onPress={handleBadgeContinue}>
          <View style={styles.modalCard}>
            {badgeData && (
              <>
                <Image
                  source={badgeData.image}
                  style={styles.modalImg}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>{badgeData.title}</Text>
                {badgeData.subtitle && (
                  <Text style={styles.modalSub}>{badgeData.subtitle}</Text>
                )}
                <Text style={styles.modalHint}>Unlocked! 🎉</Text>
                <TouchableOpacity
                  onPress={handleBadgeContinue}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>Continue</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16 },
  card: {
    borderWidth: 0.8,
    borderColor: "#A2A2A2",
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  sentence: { marginTop: 10, textAlign: "center", fontSize: 14, color: "#333" },
  prompt: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 16,
    marginBottom: 28,
    fontWeight: "bold",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: "100%",
    backgroundColor: "#fff",
  },
  choiceLabel: { fontWeight: "bold", marginRight: 10, color: "#333" },
  choiceText: { fontSize: 14, flexShrink: 1 },
  correctChoice: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
  wrongChoice: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
  feedbackContainer: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  feedbackCorrect: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
  feedbackWrong: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
  feedbackText: { textAlign: "center", fontWeight: "bold" },
  feedbackTextCorrect: { color: "#1F8F5F" },
  feedbackTextWrong: { color: "#C43D3D" },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  // Badge modal styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    width: "80%",
  },
  modalImg: { width: 96, height: 96, marginBottom: 12 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    color: "#555",
  },
  modalHint: { fontSize: 14, color: "#111", marginBottom: 12 },
  modalBtn: {
    backgroundColor: "#6B6EF9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});