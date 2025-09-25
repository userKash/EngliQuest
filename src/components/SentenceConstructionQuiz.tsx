import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  UIManager, LayoutAnimation, ScrollView, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrimaryButton from "./PrimaryButton";
import ResultModal from "./ResultModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initFirebase } from "../../firebaseConfig";

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
  levelId?: string;
};

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
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

export default function SentenceConstructionQuiz({ onProgressChange, levelId }: Props) {
  const insets = useSafeAreaInsets();

  // ---- FIRESTORE FETCH ----
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        const subLevel = levelId?.replace("trans-", "");
        const firestoreLevel = LEVEL_MAP[subLevel ?? ""];

        if (!firestoreLevel) {
          console.warn(`No mapping found for ${levelId}`);
          setLoading(false);
          return;
        }

        let snapshot;
        if (db.collection) {
          try {
            snapshot = await db
              .collection("quizzes")
              .where("userId", "==", user.uid)
              .where("level", "==", firestoreLevel)
              .where("gameMode", "==", "Sentence Construction")
              .orderBy("createdAt", "desc")
              .limit(1)
              .get();
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              snapshot = await db
                .collection("quizzes")
                .where("userId", "==", user.uid)
                .where("level", "==", firestoreLevel)
                .where("gameMode", "==", "Sentence Construction")
                .limit(1)
                .get();
            } else throw err;
          }
        } else {
          const { collection, query, where, orderBy, limit, getDocs } =
            await import("firebase/firestore");
          let q;
          try {
            q = query(
              collection(db, "quizzes"),
              where("userId", "==", user.uid),
              where("level", "==", firestoreLevel),
              where("gameMode", "==", "Sentence Construction"),
              orderBy("createdAt", "desc"),
              limit(1)
            );
          } catch (err: any) {
            if (String(err.message).includes("failed-precondition")) {
              q = query(
                collection(db, "quizzes"),
                where("userId", "==", user.uid),
                where("level", "==", firestoreLevel),
                where("gameMode", "==", "Sentence Construction"),
                limit(1)
              );
            } else throw err;
          }
          snapshot = await getDocs(q);
        }

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          if (data.questions) {
            const mapped: Item[] = data.questions.map((q: any, i: number) => ({
              id: `${i}`,
              answer: q.options[q.correctIndex],
              points: 12,
              alsoAccept: [],
            }));
            setItems(mapped);
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

  // ---- QUIZ STATE ----
  const total = items.length;
  const [index, setIndex] = useState(0);
  const current = items[index];

  const [pool, setPool] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    if (!current) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPool(shuffle(toTokens(current.answer)));
    setSelected([]);
    setLocked(false);
    setIsCorrect(null);
    onProgressChange?.({ current: index, total });
  }, [index, total, current?.answer, onProgressChange]);

  // ---- SAVE PROGRESS ----
  const saveResults = async () => {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user || !levelId) return;

      const subLevel = levelId.replace("trans-", "");
      const firestoreLevel = LEVEL_MAP[subLevel] ?? "Unknown";

      const correctAnswers = correctCount;
      const percentage = Math.round((correctAnswers / total) * 100);

      // Save locally
      const storageKey = `SentenceConstructionProgress_${user.uid}`;
      const stored = await AsyncStorage.getItem(storageKey);
      let progress = stored ? JSON.parse(stored) : {};
      progress[levelId] = {
        score: Math.max(progress[levelId]?.score ?? 0, percentage),
        attempted: true,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(progress));
      console.log("✅ Local progress saved:", progress);

      // Get username
      let userName = "Anonymous";
      if (db.collection) {
        const docSnap = await db.collection("users").doc(user.uid).get();
        if (docSnap.exists) {
          userName = docSnap.data().name || "Anonymous";
        }
      } else {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          userName = (userDoc.data() as any).name || "Anonymous";
        }
      }

      // Save to Firestore scores collection
      if (db.collection) {
        const firestore = (await import("@react-native-firebase/firestore")).default;
        await db.collection("scores").add({
          userId: user.uid,
          userName,
          quizType: "Sentence Construction",
          difficulty: firestoreLevel,
          userscore: percentage,
          totalscore: 100,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const { collection, addDoc, serverTimestamp } = await import("firebase/firestore");
        await addDoc(collection(db, "scores"), {
          userId: user.uid,
          userName,
          quizType: "Sentence Construction",
          difficulty: firestoreLevel,
          userscore: percentage,
          totalscore: 100,
          createdAt: serverTimestamp(),
        });
      }

      console.log(`✅ Score uploaded: ${percentage}% (${correctAnswers}/${total})`);
    } catch (err) {
      console.error("❌ Error saving results:", err);
    }
  };

  // ---- HANDLERS ----
  const onPick = (tok: string, i: number) => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = [...pool];
    next.splice(i, 1);
    setPool(next);
    setSelected((s) => [...s, tok]);
  };

  const onUnpick = (i: number) => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextSel = [...selected];
    const [tok] = nextSel.splice(i, 1);
    setSelected(nextSel);
    setPool((p) => [...p, tok]);
  };

  const onReset = () => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected([]);
    setPool(shuffle(toTokens(current.answer)));
  };

  const check = () => {
    if (locked || selected.length === 0) return;

    const guessRaw = selected.join(" ");
    const guess = normalize(guessRaw);
    const correct = normalize(current.answer);
    const alts = (current.alsoAccept ?? []).map(normalize);
    const ok = guess === correct || alts.includes(guess);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCorrect(ok);
    setLocked(true);
    if (ok) setScore((s) => s + (current.points ?? 12));

    setCorrectCount((c) => (ok ? c + 1 : c));
    setReview((r) => [
      ...r,
      {
        question: "Arrange the words to form a sentence",
        yourAnswer: guessRaw,
        isCorrect: ok,
        correctAnswer: ok ? undefined : current.answer,
      },
    ]);
  };

  const next = async () => {
    if (!locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (index < total - 1) {
      setIndex((i) => i + 1);
    } else {
      await saveResults(); // 🔹 Save when quiz finishes
      setShowModal(true);
    }
  };

  const actionLabel = locked ? (index < total - 1 ? "Next Question" : "Finish") : "Check";
  const actionHandler = locked ? next : check;
  const actionDisabled = !locked && selected.length === 0;

  // ---- RENDER ----
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arrange the words</Text>
          <Text style={styles.cardBody}>
            Arrange the words below to form a correct sentence. Tap words to add them to your
            sentence.
          </Text>
        </View>

        {/* Your Sentence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Sentence</Text>
          <View style={styles.dashedBox}>
            {selected.length === 0 ? (
              <Text style={styles.placeholder}>Tap words below to build your sentence</Text>
            ) : (
              <View style={styles.rowWrap}>
                {selected.map((tok, i) => (
                  <TouchableOpacity
                    key={`${tok}-${i}`}
                    onPress={() => onUnpick(i)}
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
                  onPress={() => onPick(tok, i)}
                  style={styles.poolChip}
                >
                  <Text style={styles.poolChipText}>{tok}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={onReset}
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
            <View style={[styles.feedback, isCorrect ? styles.okBox : styles.badBox]}>
              <Text style={[styles.feedbackTitle, isCorrect ? styles.okText : styles.badText]}>
                {isCorrect ? `✅ Correct: +${current.points ?? 12} points` : "❌ Incorrect"}
              </Text>
              {!isCorrect && (
                <Text style={styles.feedbackText}>
                  Correct order:{" "}
                  <Text style={{ fontWeight: "700" }}>{normalize(current.answer)}</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 120 }]}>
        <PrimaryButton label={actionLabel} onPress={actionHandler} disabled={actionDisabled} />
      </View>

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
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  card: {
    borderWidth: 1,
    borderColor: '#E4E6EE',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 12,
    minHeight: 135,
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6, color: '#0F1728' },
  cardBody: { color: '#6B7280', fontSize: 13, lineHeight: 18 },
  sectionTitle: { fontWeight: '800', marginBottom: 8, color: '#0F1728', fontSize: 15 },

  dashedBox: {
    minHeight: 56,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D4D7E2',
    borderRadius: 12,
    backgroundColor: '#FCFCFE',
    padding: 12,
    justifyContent: 'center',
  },
  placeholder: { color: '#A0A4AE' },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  selChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9C2FF',
    backgroundColor: '#EEF0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selChipText: { fontWeight: '700', color: '#4E56C9' },

  poolChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  poolChipText: { fontWeight: '600', color: '#222' },

  outerPoolBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
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
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { fontSize: 16, fontWeight: '700', color: '#444' },

  feedback: { marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  okBox: { backgroundColor: '#E9F8EE', borderColor: '#2EB872' },
  badBox: { backgroundColor: '#FDECEC', borderColor: '#F26D6D' },
  feedbackTitle: { fontWeight: '800', marginBottom: 6 },
  okText: { color: '#1F8F5F' },
  badText: { color: '#C43D3D' },
  feedbackText: { color: '#0F1728' },

  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
    backgroundColor: 'transparent',
  },
});