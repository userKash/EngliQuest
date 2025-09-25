import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "./PrimaryButton";
import ResultModal from "../components/ResultModal";
import { initFirebase } from "../../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";

const STORAGE_KEY = "GrammarProgress";
type GrammarQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation?: string;
};

type Props = {
  questions: GrammarQuestion[];
  onFinish?: (finalScore: number, totalQuestions: number) => void;
  onProgressChange?: (p: { current: number; total: number }) => void;
};

export default function GrammarQuiz({ questions, onFinish, onProgressChange }: Props) {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const { levelId } = route.params;

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

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
    } catch (err) {
      console.error("❌ Error saving progress:", err);
    }
  }

  async function saveScoreToFirestore(finalScore: number, totalQuestions: number) {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const correctAnswers = finalScore / 10;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      let userName = "Anonymous";
      const docSnap = await db.collection("users").doc(uid).get();
      if (docSnap.exists) {
        userName = docSnap.data()?.name || "Anonymous";
      }

      await db.collection("scores").add({
        userId: uid,
        userName,
        quizType: "Grammar",
        difficulty: "Easy", // can be dynamic per level
        userscore: percentage,
        totalscore: 100,
        createdAt: new Date(),
      });

      console.log(`✅ Score saved to Firestore: ${percentage}% for user ${userName}`);
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

  if (!questions.length) {
    return (
      <View style={styles.center}>
        <Text>No questions available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.prompt}>{question.prompt}</Text>

          {question.choices.map((choice, i) => {
            const correct = question.correctIndex === i;
            const isSelected = selected === i;

            let choiceStyle = styles.choice;
            if (selected !== null) {
              if (correct) choiceStyle = { ...choiceStyle, ...styles.correctChoice };
              else if (isSelected) choiceStyle = { ...choiceStyle, ...styles.wrongChoice };
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
              selected === question.correctIndex ? styles.feedbackCorrect : styles.feedbackWrong,
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
              {selected === question.correctIndex ? "✅ Correct! +10 points" : "❌ Incorrect"}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {selected !== null && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}>
          <PrimaryButton label={last ? "Finish" : "Next Question"} onPress={handleNext} />
        </View>
      )}

      <ResultModal
        visible={showResult}
        score={score / 10}
        total={questions.length}
        review={review}
        onRequestClose={() => setShowResult(false)}
        title="🎉 Great job!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16 },
  card: { borderWidth: 0.8, borderColor: "#A2A2A2", padding: 20, borderRadius: 16, backgroundColor: "#fff" },
  prompt: { marginTop: 10, textAlign: "center", fontSize: 16, marginBottom: 28, fontWeight: "bold" },
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
  feedbackContainer: { borderWidth: 1, padding: 12, borderRadius: 10, marginTop: 12 },
  feedbackCorrect: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
  feedbackWrong: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
  feedbackText: { textAlign: "center", fontWeight: "bold" },
  feedbackTextCorrect: { color: "#1F8F5F" },
  feedbackTextWrong: { color: "#C43D3D" },
  bottomBar: { position: "absolute", left: 16, right: 16, bottom: 0, paddingTop: 10, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
