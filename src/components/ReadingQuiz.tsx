import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import ResultModal from "../components/ResultModal";

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
  onFinish: (finalScore: number) => void; // raw correct count
};

export default function ReadingQuiz({
  questions,
  passageTitle = "Passage",
  onProgressChange,
  onFinish,
}: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [review, setReview] = useState<any[]>([]);

  const current = questions[index];

  useEffect(() => {
    onProgressChange?.({ current: index, total: questions.length });
  }, [index, questions.length]);

  const handleSelect = (ci: number) => {
    if (showAnswer) return; // already answered
    setSelected(ci);
    setShowAnswer(true);

    const correct = ci === current.correctIndex;
    if (correct) setScore((s) => s + 1);

    // push to review list
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

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
    } else {
      // finished → show modal
      setShowResult(true);
      onFinish(score);
    }
  };

  const choiceStyle = (i: number) => {
    if (!showAnswer) return styles.choice;
    if (i === current.correctIndex) return [styles.choice, styles.choiceCorrect];
    if (i === selected && i !== current.correctIndex)
      return [styles.choice, styles.choiceWrong];
    return styles.choice;
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
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
              style={choiceStyle(ci)}
              onPress={() => handleSelect(ci)}
              disabled={showAnswer}
            >
              <Text style={styles.choiceText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Explanation */}
        {showAnswer && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationTitle}>
              {selected === current.correctIndex ? "✅ Correct" : "❌ Incorrect"}
            </Text>
            <Text style={styles.explanationText}>
              {current.explanation ??
                `Correct answer: ${current.choices[current.correctIndex]}`}
            </Text>
          </View>
        )}

        {/* Next / Finish */}
        {showAnswer && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {index + 1 === questions.length ? "Finish" : "Next"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Result Modal */}
      <ResultModal
        visible={showResult}
        score={score}
        total={questions.length}
        review={review}
        onRequestClose={() => setShowResult(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16, backgroundColor: "#fff" },

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

  nextButton: {
    alignSelf: "flex-end",
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  nextButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
