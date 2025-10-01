// src/components/ReadingQuiz.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import ResultModal from "../components/ResultModal";
import PrimaryButton from "../components/PrimaryButton";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen";
import type { RootStackParamList } from "../navigation/type";

type InQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
  passage?: string;
};

type Props = {
  questions: InQuestion[];
  passageTitle?: string;
  onProgressChange?: (p: { current: number; total: number }) => void;
  onFinish?: (percentage: number) => void;
};

export default function ReadingQuiz({
  questions,
  passageTitle = "Passage",
  onProgressChange,
  onFinish,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { levelId, progress } = route.params || {};

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [review, setReview] = useState<any[]>([]);

  // ✅ Badge feature preserved
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const current = questions[index];
  const last = index === questions.length - 1;

useEffect(() => {
  onProgressChange?.({ current: index, total: questions.length });
}, [index, questions.length]);

  useEffect(() => {
    setBadgeModal(newBadges.length > 0 ? newBadges[0] : null);
  }, [newBadges]);

  const handleSelect = (ci: number) => {
    if (showAnswer) return;
    setSelected(ci);
    setShowAnswer(true);

    const correct = ci === current.correctIndex;
    if (correct) setScore((s) => s + 10);

    setReview((prev) => [
      ...prev,
      {
        question: current.prompt,
        yourAnswer: current.choices[ci],
        isCorrect: correct,
        correctAnswer: current.choices[current.correctIndex],
      },
    ]);
  };

  const handleNext = async () => {
    if (!last) {
      setIndex((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      setShowResult(true);
      const correctAnswers = score / 10;
      const percentage = Math.round((correctAnswers / questions.length) * 100);

      // ✅ Badge unlocking logic untouched
      if (/-2$/.test(levelId)) {
        const unlocked = await unlockBadge("reading", levelId, progress || {});
        if (unlocked.length > 0) setNewBadges(unlocked);
      }

      onFinish?.(percentage);
    }
  };

  // ✅ Badge modal flow unchanged
  const handleBadgeContinue = () => {
    if (newBadges.length > 1) {
      setNewBadges(newBadges.slice(1));
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={insets.top + 50}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingBottom: insets.bottom + 140 }, // ✅ enough space for button + tab bar
        ]}
        showsVerticalScrollIndicator
      >
        {/* Passage */}
        <View style={styles.passageCard}>
          <Text style={styles.sectionTitle}>{passageTitle}</Text>
          <Text style={styles.passageText}>{current.passage ?? ""}</Text>
        </View>

        {/* Question */}
        <View style={styles.questionBlock}>
          <Text style={styles.prompt}>{current.prompt}</Text>
          {current.choices.map((c, ci) => (
            <TouchableOpacity
              key={ci}
              style={[
                styles.choice,
                showAnswer && ci === current.correctIndex && styles.choiceCorrect,
                showAnswer &&
                  selected === ci &&
                  ci !== current.correctIndex &&
                  styles.choiceWrong,
              ]}
              onPress={() => handleSelect(ci)}
              disabled={showAnswer}
            >
              <Text style={styles.choiceText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
{showAnswer && (
  <View style={{ minHeight: 120 }}>
    <View
      style={[
        styles.feedback,
        selected === current.correctIndex ? styles.okBox : styles.badBox,
      ]}
    >
      <Text
        style={[
          styles.feedbackTitle,
          selected === current.correctIndex ? styles.okText : styles.badText,
        ]}
      >
        {selected === current.correctIndex
          ? "✅ Correct! +10 points"
          : "❌ Incorrect"}
      </Text>

      {/* Correct answer if wrong */}
      {selected !== current.correctIndex && (
        <Text style={styles.feedbackText}>
          Correct answer: {current.choices[current.correctIndex]}
        </Text>
      )}

      {/* Explanation if provided */}
      {current.explanation && (
        <Text style={styles.feedbackText}>{current.explanation}</Text>
      )}
    </View>
  </View>
)}
        {showAnswer && (
          <View style={{ marginTop: 20 }}>
            <PrimaryButton
              label={last ? "Finish" : "Next"}
              onPress={handleNext}
            />
          </View>
        )}
      </ScrollView>
      <ResultModal
        visible={showResult}
        score={score / 10}
        total={questions.length}
        review={review}
        onRequestClose={() => setShowResult(false)}
        title="🎉 Well done!"
        onContinue={() => {
          setShowResult(false);
          if (newBadges.length === 0) {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" as keyof RootStackParamList }],
            });
          }
        }}
      />

      {/* ✅ Badge Modal restored */}
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
                <Image source={badgeData.image} style={styles.modalImg} />
                <Text style={styles.modalTitle}>{badgeData.title}</Text>
                {badgeData.subtitle && (
                  <Text style={styles.modalSub}>{badgeData.subtitle}</Text>
                )}
                <Text style={styles.modalHint}>Unlocked! 🎉</Text>
                <PrimaryButton label="Continue" onPress={handleBadgeContinue} />
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  passageCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  sectionTitle: { fontWeight: "700", marginBottom: 8, fontSize: 15 },
  passageText: { fontSize: 16, lineHeight: 22, color: "#111827" },
  questionBlock: { marginBottom: 16 },
  prompt: { fontSize: 17, fontWeight: "600", marginBottom: 12, color: "#1F2937" },
  choice: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  choiceText: { fontSize: 15, color: "#111827" },
  choiceCorrect: { backgroundColor: "#DCFCE7", borderColor: "#16A34A" },
  choiceWrong: { backgroundColor: "#FEE2E2", borderColor: "#DC2626" },
  explanationBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
    marginTop: 10,
  },
  explanationTitle: { fontWeight: "700", marginBottom: 4 },
  explanationText: { color: "#374151", fontSize: 14 },
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
  modalImg: { width: 96, height: 96, marginBottom: 12, resizeMode: "contain" },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  modalSub: { fontSize: 14, textAlign: "center", marginBottom: 8, color: "#555" },
  modalHint: { fontSize: 14, color: "#111", marginBottom: 12 },
  feedback: { marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
okBox: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
badBox: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
feedbackTitle: { fontWeight: "800", marginBottom: 6, textAlign: "center" },
okText: { color: "#1F8F5F" },
badText: { color: "#C43D3D" },
feedbackText: {
  color: "#0F1728",
  textAlign: "center",
  marginTop: 4,
  fontSize: 14,
},

});