import React, { useEffect, useState } from "react";
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
<<<<<<< HEAD
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "./PrimaryButton";
import ResultModal from "./ResultModal";
=======
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from './PrimaryButton';
import ResultModal from './ResultModal'; 
>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4

type QA = {
  filipino: string;
  note?: string;
  accepts: string[];
  points?: number;
};

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type Props = {
  questions: QA[]; // ✅ passed from Firestore
  onProgressChange?: (p: { current: number; total: number }) => void;
  onFinish?: (finalScore: number) => void;
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FilipinoToEnglishQuiz({ questions, onProgressChange, onFinish }: Props) {
  const insets = useSafeAreaInsets();
  const total = questions.length;

  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    onProgressChange?.({ current: index, total });
  }, [index, total, onProgressChange]);

  const current = questions[index];
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, " ");

  const check = () => {
    if (!value.trim() || locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const ok = current.accepts.some((a) => normalize(a) === normalize(value));
    setIsCorrect(ok);
    setLocked(true);
    if (ok) {
      setScore((s) => s + (current.points ?? 12));
      setCorrectCount((c) => c + 1);
    }

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

    if (index < total - 1) {
      setIndex((i) => i + 1);
      setValue("");
      setLocked(false);
      setIsCorrect(null);
    } else {
      setShowModal(true);
      onFinish?.(correctCount);
    }
  };

  const actionLabel = locked ? (index < total - 1 ? "Next Question" : "Finish") : "Check";
  const actionHandler = locked ? next : check;
  const actionDisabled = locked ? false : value.trim().length === 0;

<<<<<<< HEAD
=======
  const handleContinueFromModal = () => {
    // Close modal and reset for replay 
    setShowModal(false);
    setIndex(0);
    setValue('');
    setLocked(false);
    setIsCorrect(null);
    setScore(0);
    setCorrectCount(0);
    setReview([]);
  };

>>>>>>> 37d55d6a394be1f6446d1b68296697b4cdbc3ef4
  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
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
              <View style={[styles.feedbackBox, isCorrect ? styles.correctBox : styles.wrongBox]}>
                <Text style={[styles.feedbackTitle, isCorrect ? styles.correctText : styles.wrongText]}>
                  {isCorrect ? `✅ Correct: +${current.points ?? 12} points` : "❌ Incorrect"}
                </Text>
                {!isCorrect && (
                  <Text style={styles.feedbackDetail}>
                    Correct answer: <Text style={{ fontWeight: "700" }}>{current.accepts[0]}</Text>
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}>
          <PrimaryButton label={actionLabel} onPress={actionHandler} disabled={actionDisabled} />
        </View>
      </KeyboardAvoidingView>

      <ResultModal
        visible={showModal}
        score={correctCount}
        total={total}
        review={review}
        onRequestClose={() => setShowModal(false)}
        title="🎉 Great job!"
      />
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
  word: { fontSize: 36, fontWeight: "800", textAlign: "center", marginBottom: 4, color: "#5E67CC", marginVertical: 30 },
  note: { textAlign: "center", color: "#666", marginBottom: 8, marginVertical: 30 },
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
});
