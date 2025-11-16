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
import { AudioManager } from "../../utils/AudioManager"; 

type InQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
  passage?: string;
  clue?: string;
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
  const { levelId } = route.params || {};

  // Group questions by passage
  const groups = Object.values(
    questions.reduce((acc, q) => {
      const key = q.passage || "Untitled Passage";
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {} as Record<string, InQuestion[]>)
  );

  const [groupIndex, setGroupIndex] = useState(0);
  const [phase, setPhase] = useState<"story" | "questions">("story");
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [review, setReview] = useState<any[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const currentGroup = groups[groupIndex];
  const currentQuestion = currentGroup[index];
  const lastQuestionInGroup = index === currentGroup.length - 1;
  const lastGroup = groupIndex === groups.length - 1;

  useEffect(() => {
    onProgressChange?.({ current: groupIndex, total: groups.length });
  }, [groupIndex, groups.length]);

  useEffect(() => {
    setBadgeModal(newBadges.length > 0 ? newBadges[0] : null);
  }, [newBadges]);

const handleSelect = (ci: number) => {
  if (showAnswer) return;

  const correct = ci === currentQuestion.correctIndex;

  // Fire-and-forget SFX
  if (correct) AudioManager.playCorrectSfx();
  else AudioManager.playWrongSfx();

  // Update state after starting SFX
  setSelected(ci);
  setShowAnswer(true);

  setReview((prev) => [
    ...prev,
    {
      question: currentQuestion.prompt,
      yourAnswer: currentQuestion.choices[ci],
      isCorrect: correct,
      correctAnswer: currentQuestion.choices[currentQuestion.correctIndex],
    },
  ]);
};




  const handleNext = async () => {
    if (phase === "story") {
      // move from story to questions
      setPhase("questions");
      return;
    }

    if (!lastQuestionInGroup) {
      // next question
      setIndex((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
    } else if (!lastGroup) {
      // move to next story
      setGroupIndex((g) => g + 1);
      setIndex(0);
      setPhase("story");
      setSelected(null);
      setShowAnswer(false);
    } else {
      // last story done
      setShowResult(true);
      const correctAnswers = score / 10;
      const percentage = Math.round(
        (correctAnswers / questions.length) * 100
      );

      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      const STORAGE_KEY = "ReadingProgress";
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let progress = stored ? JSON.parse(stored) : {};
      progress[levelId] = { score: percentage, attempted: true };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));

      onFinish?.(percentage);
    }
  };

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

  // STORY PHASE
  if (phase === "story") {
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
            { paddingBottom: insets.bottom + 140 },
          ]}
        >
          <View style={styles.passageCard}>
            <Text style={styles.sectionTitle}>Story {groupIndex + 1}</Text>
            <Text style={styles.passageText}>
              {currentGroup[0].passage ?? ""}
            </Text>
          </View>

          <PrimaryButton
            label="Next: Questions"
            onPress={handleNext}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
          { paddingBottom: insets.bottom + 140 },
        ]}
      >
      {currentQuestion.clue && (
        <View style={[styles.feedback, styles.clueBox]}>
          <Text style={[styles.feedbackTitle, styles.clueTitle]}>💡 Hint</Text>
          <Text style={styles.clueText}>{currentQuestion.clue}</Text>
        </View>
      )}
        <View style={styles.questionBlock}>
          <Text style={styles.prompt}>{currentQuestion.prompt}</Text>
          {currentQuestion.choices.map((c, ci) => (
            <TouchableOpacity
              key={ci}
              style={[
                styles.choice,
                showAnswer &&
                  ci === currentQuestion.correctIndex &&
                  styles.choiceCorrect,
                showAnswer &&
                  selected === ci &&
                  ci !== currentQuestion.correctIndex &&
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
                selected === currentQuestion.correctIndex
                  ? styles.okBox
                  : styles.badBox,
              ]}
            >
              <Text
                style={[
                  styles.feedbackTitle,
                  selected === currentQuestion.correctIndex
                    ? styles.okText
                    : styles.badText,
                ]}
              >
                {selected === currentQuestion.correctIndex
                  ? "Correct! +10 points"
                  : "Incorrect"}
              </Text>

              {selected !== currentQuestion.correctIndex && (
                <Text style={styles.feedbackText}>
                  Correct answer:{" "}
                  {currentQuestion.choices[currentQuestion.correctIndex]}
                </Text>
              )}

              {currentQuestion.explanation && (
                <Text style={styles.feedbackText}>
                  {currentQuestion.explanation}
                </Text>
              )}
            </View>

            <View style={{ marginTop: 20 }}>
              <PrimaryButton
                label={
                  lastQuestionInGroup
                    ? lastGroup
                      ? "Finish Quiz"
                      : "Next Story"
                    : "Next Question"
                }
                onPress={handleNext}
              />
            </View>
          </View>
        )}
      </ScrollView>

      <ResultModal
        visible={showResult}
        score={score / 10}
        total={questions.length}
        review={review}
        onRequestClose={() => setShowResult(false)}
        title="Well done!"
        onContinue={async () => {
          setShowResult(false);
          const correctAnswers = score / 10;
          const percentage = Math.round(
            (correctAnswers / questions.length) * 100
          );

          if (percentage >= 70) {
            try {
              const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
              const STORAGE_KEY = "ReadingProgress";
              const stored = await AsyncStorage.getItem(STORAGE_KEY);
              const progress = stored ? JSON.parse(stored) : {};

              const unlocked = await unlockBadge("reading", levelId, progress);
              if (unlocked.length > 0) {
                setNewBadges(unlocked);
                return;
              }
            } catch (err) {
              console.error("Error unlocking badge after Reading result:", err);
            }
          }
          navigation.reset({
            index: 0,
            routes: [{ name: "Home" as keyof RootStackParamList }],
          });
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
                <Image source={badgeData.image} style={styles.modalImg} />
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
  sectionTitle: { fontWeight: "700", marginBottom: 8, fontSize: 17 },
  passageText: { fontSize: 16, lineHeight: 22, color: "#111827" },
  questionBlock: { marginBottom: 16 },
  prompt: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 12,
    color: "#1F2937",
  },
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
  modalBtn: {
    backgroundColor: "#6B6EF9",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
  clueBox: {
  backgroundColor: "#F4F6FF",  
  borderColor: "#5E67CC",     
  borderWidth: 1,
  marginBottom: 12,
  padding: 12,
  borderRadius: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 1,
},

clueTitle: {
  color: "#5E67CC",         
  fontSize: 14,
  fontWeight: "700",
  marginBottom: 6,
  textAlign: "left",
},

clueText: {
  color: "#0F1728",  
  fontSize: 14,
  lineHeight: 20,
  textAlign: "left",
},

});
