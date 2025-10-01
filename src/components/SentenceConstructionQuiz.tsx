import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  ScrollView,
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PrimaryButton from "./PrimaryButton";
import ResultModal from "./ResultModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initFirebase } from "../../firebaseConfig";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen";
import type { RootStackParamList } from "../navigation/type";

type Item = {
  id: string;
  answer: string;
  points?: number;
  alsoAccept?: string[];
};

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type Props = {
  onProgressChange?: (p: { current: number; total: number }) => void;
  onFinish?: (percentage: number) => void; // ✅ just like ReadingQuiz
  levelId?: string;
};

// Android layout animations
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const normalize = (s: string) =>
  s.trim().replace(/\s+/g, " ").replace(/[.!?]+$/g, "").toLowerCase();
const toTokens = (s: string) => normalize(s).split(" ");
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

export default function SentenceConstructionQuiz({
  onProgressChange,
  onFinish,
  levelId,
}: Props) {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🔹 State
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [review, setReview] = useState<ReviewItem[]>([]);
  const [showResult, setShowResult] = useState(false);

  // 🔹 Badge
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const total = items.length;
  const current = items[index];
  const last = index === total - 1;

  // 🔹 Load Firestore quiz
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const subLevel = levelId?.replace("sc-", "");
        const firestoreLevel = LEVEL_MAP[subLevel ?? ""];

        if (!firestoreLevel) {
          console.warn(`No mapping found for ${levelId}`);
          setLoading(false);
          return;
        }

        const snapshot = await db
          .collection("quizzes")
          .where("userId", "==", user.uid)
          .where("level", "==", firestoreLevel)
          .where("gameMode", "==", "Sentence Construction")
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.questions) {
            setItems(
              data.questions.map((q: any, i: number) => ({
                id: `${i}`,
                answer: q.options[q.correctIndex],
                points: 12,
                alsoAccept: [],
              }))
            );
          }
        }
      } catch (err) {
        console.error("❌ Error fetching Sentence Construction quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [levelId]);

  // 🔹 Reset when question changes
  useEffect(() => {
    if (!current) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPool(shuffle(toTokens(current.answer)));
    setSelected([]);
    setLocked(false);
    setIsCorrect(null);
    onProgressChange?.({ current: index, total });
  }, [index, total, current?.answer]);

  // 🔹 Save Results
  const saveResults = async () => {
    try {
      const { auth } = await initFirebase();
      const user = auth.currentUser;
      if (!user || !levelId) return;

      const percentage = Math.round((correctCount / total) * 100);

      // Local save
      const storageKey = `SentenceConstructionProgress_${user.uid}`;
      const stored = await AsyncStorage.getItem(storageKey);
      let progress = stored ? JSON.parse(stored) : {};
      progress[levelId] = {
        score: Math.max(progress[levelId]?.score ?? 0, percentage),
        attempted: true,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(progress));

      // Firestore save delegated to parent
      onFinish?.(percentage);

      // Badge unlock
      if (percentage >= 70 && /-2$/.test(levelId)) {
        const unlocked = await unlockBadge("trans", levelId, progress);
        if (unlocked.length > 0) setNewBadges(unlocked);
      }

      console.log(`✅ Score saved: ${percentage}%`);
    } catch (err) {
      console.error("❌ Error saving results:", err);
    }
  };

  // 🔹 Handlers
  const check = () => {
    if (locked || selected.length === 0) return;
    const guessRaw = selected.join(" ");
    const guess = normalize(guessRaw);
    const correct = normalize(current.answer);
    const ok = guess === correct;

    setIsCorrect(ok);
    setLocked(true);
    if (ok) setScore((s) => s + (current.points ?? 12));
    setCorrectCount((c) => (ok ? c + 1 : c));
    setReview((r) => [
      ...r,
      {
        question: "Arrange the words",
        yourAnswer: guessRaw,
        isCorrect: ok,
        correctAnswer: ok ? undefined : current.answer,
      },
    ]);
  };

  const next = async () => {
    if (!locked) return;
    if (!last) {
      setIndex((i) => i + 1);
    } else {
      await saveResults();
      setShowResult(true);
    }
  };

  // 🔹 Badge modal flow
  useEffect(() => {
    setBadgeModal(newBadges.length > 0 ? newBadges[0] : null);
  }, [newBadges]);

  const handleBadgeContinue = () => {
    if (newBadges.length > 1) {
      setNewBadges(newBadges.slice(1));
    } else {
      setNewBadges([]);
      setBadgeModal(null);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" as keyof RootStackParamList }],
      });
    }
  };

  const badgeData = badgeModal
    ? BADGES.find((b: { id: string }) => b.id === badgeModal)
    : null;

  // 🔹 Render
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text>No quiz found for {levelId}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arrange the words</Text>
          <Text style={styles.cardBody}>
            Arrange the words below to form a correct sentence. Tap words to
            build your sentence.
          </Text>
        </View>

        {/* Your Sentence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Sentence</Text>
          <View style={styles.dashedBox}>
            {selected.length === 0 ? (
              <Text style={styles.placeholder}>
                Tap words below to build your sentence
              </Text>
            ) : (
              <View style={styles.rowWrap}>
                {selected.map((tok, i) => (
                  <TouchableOpacity
                    key={`${tok}-${i}`}
                    onPress={() => {
                      if (!locked) {
                        const nextSel = [...selected];
                        const [word] = nextSel.splice(i, 1);
                        setSelected(nextSel);
                        setPool((p) => [...p, word]);
                      }
                    }}
                    style={styles.selChip}
                  >
                    <Text style={styles.selChipText}>{tok}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Available Words */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Words</Text>
          <View style={styles.outerPoolBox}>
            <View style={[styles.rowWrap, { flex: 1 }]}>
              {pool.map((tok, i) => (
                <TouchableOpacity
                  key={`${tok}-${i}`}
                  onPress={() => {
                    if (!locked) {
                      const next = [...pool];
                      next.splice(i, 1);
                      setPool(next);
                      setSelected((s) => [...s, tok]);
                    }
                  }}
                  style={styles.poolChip}
                >
                  <Text style={styles.poolChipText}>{tok}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!locked)
                  setSelected([]),
                    setPool(shuffle(toTokens(current.answer)));
              }}
              disabled={locked}
              style={[styles.resetBtn, locked && { opacity: 0.5 }]}
            >
              <Text style={styles.resetText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback */}
        <View style={{ minHeight: 84 }}>
          {isCorrect !== null && (
            <View
              style={[styles.feedback, isCorrect ? styles.okBox : styles.badBox]}
            >
              <Text
                style={[
                  styles.feedbackTitle,
                  isCorrect ? styles.okText : styles.badText,
                ]}
              >
                {isCorrect
                  ? `✅ Correct: +${current.points ?? 12} points`
                  : "❌ Incorrect"}
              </Text>
              {!isCorrect && (
                <Text style={styles.feedbackText}>
                  Correct order: {current.answer}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 120 }]}>
        <PrimaryButton
          label={locked ? (last ? "Finish" : "Next Question") : "Check"}
          onPress={locked ? next : check}
          disabled={!locked && selected.length === 0}
        />
      </View>

      {/* Result Modal */}
      <ResultModal
        visible={showResult}
        score={correctCount}
        total={total}
        review={review}
        onRequestClose={() => setShowResult(false)}
        title="🎉 Great job!"
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

      {/* Badge Modal */}
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
                <PrimaryButton
                  label="Continue"
                  onPress={handleBadgeContinue}
                />
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    borderWidth: 1,
    borderColor: "#E4E6EE",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 14,
    marginBottom: 12,
    minHeight: 135,
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6, color: "#0F1728" },
  cardBody: { color: "#6B7280", fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontWeight: "800", marginBottom: 8, color: "#0F1728", fontSize: 15 },

  dashedBox: {
    minHeight: 56,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D4D7E2",
    borderRadius: 12,
    backgroundColor: "#FCFCFE",
    padding: 12,
    justifyContent: "center",
  },
  placeholder: { color: "#A0A4AE" },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  selChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#B9C2FF",
    backgroundColor: "#EEF0FF",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selChipText: { fontWeight: "700", color: "#4E56C9" },

  poolChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    backgroundColor: "#FAFAFA",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  poolChipText: { fontWeight: "600", color: "#222" },

  outerPoolBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 12,
    padding: 8,
    marginTop: 6,
    paddingVertical: 16,
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

  feedback: { marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  okBox: { backgroundColor: "#E9F8EE", borderColor: "#2EB872" },
  badBox: { backgroundColor: "#FDECEC", borderColor: "#F26D6D" },
  feedbackTitle: { fontWeight: "800", marginBottom: 6 },
  okText: { color: "#1F8F5F" },
  badText: { color: "#C43D3D" },
  feedbackText: { color: "#0F1728" },

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
    backgroundColor: "transparent",
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
});