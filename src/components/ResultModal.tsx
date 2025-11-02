import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type ResultModalProps = {
  visible: boolean;
  score: number;
  total: number;
  review: ReviewItem[];
  onRequestClose?: () => void;
  onContinue?: () => void; 
  title?: string;
};

export default function ResultModal({
  visible,
  score,
  total,
  review,
  onRequestClose,
  onContinue,
  title = "Congratulations!",
}: ResultModalProps) {
  const pct = Math.round((score / Math.max(total, 1)) * 100);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.overlay}>
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.percent}>{pct}%</Text>
            <Text style={styles.subtitle}>
              You got {score} out of {total} questions correct
            </Text>

            <Text style={styles.sectionLabel}>Review Your Answers:</Text>

            <ScrollView
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {review.map((item, idx) => (
                <View key={idx} style={styles.qaItem}>
                  <Text style={styles.qText}>{`Q${idx + 1}. ${item.question}`}</Text>
                  <Text
                    style={[
                      styles.aText,
                      item.isCorrect ? styles.correct : styles.incorrect,
                    ]}
                  >
                    Your answer: {item.yourAnswer} {item.isCorrect ? "✓" : "✗"}
                  </Text>

                  {!item.isCorrect && item.correctAnswer ? (
                    <Text style={styles.correctRef}>
                      Correct answer: {item.correctAnswer}
                    </Text>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            {/*  Close modal + delegate next step */}
            <TouchableOpacity
              onPress={() => {
                if (onRequestClose) onRequestClose(); // hide modal
                if (onContinue) onContinue(); // trigger parent flow
              }}
              style={styles.cta}
            >
              <Text style={styles.ctaText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  centerWrap: {
    width: "100%",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  percent: {
    fontSize: 40,
    fontWeight: "800",
    color: "#4F46E5",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
    color: "#222",
  },
  sectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  list: {
    borderRadius: 10,
  },
  qaItem: {
    backgroundColor: "#F7F7FB",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  qText: {
    fontSize: 13,
    color: "#111827",
    marginBottom: 6,
    fontWeight: "600",
  },
  aText: {
    fontSize: 13,
  },
  correct: { color: "#10B981" },
  incorrect: { color: "#EF4444" },
  correctRef: {
    fontSize: 12,
    color: "#374151",
    marginTop: 4,
  },
  cta: {
    marginTop: 8,
    backgroundColor: "#4F46E5",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
