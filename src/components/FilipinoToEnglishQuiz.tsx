// src/components/FilipinoToEnglishQuiz.tsx
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import PrimaryButton from "./PrimaryButton";
import ResultModal from "./ResultModal";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen";
import type { RootStackParamList } from "../navigation/type";

type QA = {
  filipino: string;
  note?: string;
  accepts: string[];
};

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type Props = {
  questions: QA[];
  onProgressChange?: (p: { current: number; total: number }) => void;
  onFinish?: (percentage: number) => void;
};

const STORAGE_KEY = "TranslationProgress";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FilipinoToEnglishQuiz({
  questions,
  onProgressChange,
  onFinish,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<any>();
  const { levelId } = route.params || {};

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);

  // Badge state
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const total = questions.length;
  const last = index === total - 1;
  const current = questions[index];

  useEffect(() => {
    onProgressChange?.({ current: index, total });
  }, [index, total]);

  // sync badge modal with unlocked badges
  useEffect(() => {
    if (newBadges.length > 0) {
      const normalized = newBadges[0].replace(/-\d+$/, "");
      console.log("🎯 Opening badge modal for:", normalized);
      setBadgeModal(normalized);
    } else {
      setBadgeModal(null);
    }
  }, [newBadges]);

  const normalize = (s: string) =>
    s.toLowerCase().trim().replace(/\s+/g, " ");

  const check = () => {
    if (!value.trim() || locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const ok = current.accepts.some((a) => normalize(a) === normalize(value));
    setIsCorrect(ok);
    setLocked(true);

    if (ok) setScore((s) => s + 10);

    setReview((r) => [
      ...r,
      {
        question: current.filipino,
        yourAnswer: value.trim(),
        isCorrect: ok,
        correctAnswer: ok ? undefined : current.accepts[0],
      },
    ]);
  };

  const next = () => {
    if (!locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (!last) {
      setIndex((i) => i + 1);
      setValue("");
      setLocked(false);
      setIsCorrect(null);
    } else {
      setShowResult(true);
    }
  };

  const reviewData = useMemo(() => review, [review]);

  const actionLabel = locked ? (last ? "Finish" : "Next Question") : "Check";
  const actionHandler = locked ? next : check;
  const actionDisabled = locked ? false : value.trim().length === 0;

  // badge continue flow
  const handleBadgeContinue = () => {
    if (newBadges.length > 1) {
      const [, ...rest] = newBadges;
      setNewBadges(rest);
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
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Translate to English</Text>
            <Text style={styles.word}>{current.filipino}</Text>
            {!!current.note && <Text style={styles.note}>{current.note}</Text>}
          </View>

          <View style={styles.outerInputBox}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(t) => {
                if (locked) return;
                setValue(t);
              }}
              placeholder="Type your answer here..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!locked}
              returnKeyType="done"
              onSubmitEditing={check}
            />
            <TouchableOpacity
              onPress={() => {
                if (locked) return;
                setValue("");
              }}
              style={[styles.resetBtn, locked && { opacity: 0.5 }]}
              disabled={locked}
            >
              <Text style={styles.resetText}>↻</Text>
            </TouchableOpacity>
          </View>

          <View style={{ minHeight: 84 }}>
            {isCorrect !== null && (
              <View
                style={[
                  styles.feedbackBox,
                  isCorrect ? styles.correctBox : styles.wrongBox,
                ]}
              >
                <Text
                  style={[
                    styles.feedbackTitle,
                    isCorrect ? styles.correctText : styles.wrongText,
                  ]}
                >
                  {isCorrect ? `✅ Correct: +10 points` : "❌ Incorrect"}
                </Text>
                {!isCorrect && (
                  <Text style={styles.feedbackDetail}>
                    Correct answer:{" "}
                    <Text style={{ fontWeight: "700" }}>
                      {current.accepts[0]}
                    </Text>
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}
        >
          <PrimaryButton
            label={actionLabel}
            onPress={actionHandler}
            disabled={actionDisabled}
          />
        </View>
      </KeyboardAvoidingView>

<ResultModal
  visible={showResult}
  score={score / 10}
  total={total}
  review={reviewData}
  onRequestClose={() => setShowResult(false)}
  title="🎉 Great job!"
  onContinue={async () => {
    setShowResult(false);

    const finalScore = score;
    const correctAnswers = finalScore / 10;
    const percentage = Math.round((correctAnswers / total) * 100);

    try {
      // 1. Save to AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      let localProgress = stored ? JSON.parse(stored) : {};
      localProgress[levelId] = {
        score: Math.max(localProgress[levelId]?.score ?? 0, percentage),
        attempted: true,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(localProgress));
      console.log("✅ Saved Translation progress:", localProgress);

      // 2. Unlock badges if passed
      if (percentage >= 70) {
        console.log("✅ Passed translation quiz, unlocking badges...");
        const unlocked = await unlockBadge("trans", levelId, localProgress);
        if (unlocked.length > 0) {
          setNewBadges(unlocked);
          return; // ⬅️ stop here, wait for badge modal
        }
      } else {
        console.log("❌ Translation quiz failed — no badges unlocked");
      }
    } catch (err) {
      console.error("❌ Error saving progress/unlocking badge:", err);
    }

    // ⬇️ only runs if no badge unlocked
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
                <PrimaryButton label="Continue" onPress={handleBadgeContinue} />
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  cardTitle: { fontWeight: "700", textAlign: "center", marginBottom: 8 },
  word: {
    fontSize: 36,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 4,
    color: "#5E67CC",
    marginVertical: 30,
  },
  note: {
    textAlign: "center",
    color: "#666",
    marginBottom: 8,
    marginVertical: 30,
  },
  outerInputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    paddingVertical: 30,
  },
  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  resetBtn: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: { fontSize: 16, fontWeight: "700", color: "#444" },
  feedbackBox: { borderRadius: 12, padding: 14, borderWidth: 1 },
  correctBox: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
  wrongBox: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
  feedbackTitle: { fontWeight: "700", marginBottom: 6, textAlign: "left" },
  correctText: { color: "#1F8F5F" },
  wrongText: { color: "#C43D3D" },
  feedbackDetail: { color: "#333" },
  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
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
  modalSub: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    color: "#555",
  },
  modalHint: { fontSize: 14, color: "#111", marginBottom: 12 },
});