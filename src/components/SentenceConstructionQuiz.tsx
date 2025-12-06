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
import Animated, {
  FadeIn,
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import ResultModal from "./ResultModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initFirebase } from "../../firebaseConfig";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen";
import type { RootStackParamList } from "../navigation/type";
import { AudioManager } from "../../utils/AudioManager"; 
import auth from "@react-native-firebase/auth";

type Item = {
  id: string;
  answer: string;
  points?: number;
  alsoAccept?: string[];
  clue?: string; 
};

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type Props = {
  onProgressChange?: (p: { current: number; total: number }) => void;
  onFinish?: (percentage: number) => void; 
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

    const user = auth().currentUser;
    const uid = user?.uid;
    const STORAGE_KEY = `SentenceProgress_${uid}`;

  // State
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

  // Badge
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const total = items.length;
  const current = items[index];
  const last = index === total - 1;

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-100);

  // Score animation
  const scoreScale = useSharedValue(1);
  const scorePulse = useSharedValue(1);

  // Load Firestore quiz
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
                points: 10,
                alsoAccept: [],
                clue: q.clue ?? null, 
              }))
            );
          }
        }
      } catch (err) {
        console.error(" Error fetching Sentence Construction quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [levelId]);

  // Reset when question changes
  useEffect(() => {
    if (!current) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPool(shuffle(toTokens(current.answer)));
    setSelected([]);
    setLocked(false);
    setIsCorrect(null);
    onProgressChange?.({ current: index, total });

    // Animate progress bar
    progressWidth.value = withSpring((index + 1) / total, {
      damping: 15,
      stiffness: 100,
    });

    // Continuous shimmer effect
    shimmerTranslate.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 1500 }),
        withTiming(-100, { duration: 0 })
      ),
      -1,
      false
    );
  }, [index, total, current?.answer, onProgressChange]);

  // Animate score when it changes
  useEffect(() => {
    if (score > 0) {
      scoreScale.value = withSequence(
        withSpring(1.3, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );
    }
  }, [score]);

  // Continuous pulse for score card
  useEffect(() => {
    scorePulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

useEffect(() => {
  if (newBadges.length > 0) {
    const normalized = newBadges[0].replace(/-\d+$/, "");
    console.log("Opening badge modal for:", normalized);
    setBadgeModal(normalized);
  } else {
    setBadgeModal(null);
  }
}, [newBadges]);


  // Animated styles for progress bar
  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value * 100}%`,
    };
  });

  const animatedShimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
    };
  });

  // Animated styles for score
  const animatedScoreStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scoreScale.value }],
    };
  });

  const animatedScoreCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scorePulse.value }],
    };
  });

  // Save Results
const saveResults = async () => {
  try {
    const { auth } = await initFirebase();
    const user = auth.currentUser;
    if (!user || !levelId) return;

    const percentage = Math.round((correctCount / total) * 100);


    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    let progress = stored ? JSON.parse(stored) : {};

    // save local score
    progress[levelId] = {
      score: Math.max(progress[levelId]?.score ?? 0, percentage),
      attempted: true,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    console.log("Sentence progress saved locally:", progress);

    // pass to parent handler if any
    onFinish?.(percentage);
  } catch (err) {
    console.error("Error saving results:", err);
  }
};


  // Handlers
const check = () => {
  if (locked || selected.length === 0) return;

  const guessRaw = selected.join(" ");
  const guess = normalize(guessRaw);
  const correct = normalize(current.answer);
  const ok = guess === correct;

  // 🔊 Play SFX
  if (ok) AudioManager.playCorrectSfx();
  else AudioManager.playWrongSfx();

  setIsCorrect(ok);
  setLocked(true);
  if (ok) setScore((s) => s + (current.points ?? 10));
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
  //  Render
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
    <View style={{ flex: 1, marginTop: 20, backgroundColor: '#F5F6FA' }}>
      {/* Modern game header */}
      <View style={styles.gameHeader}>
        <View style={styles.statsContainer}>
          <Animated.View style={[styles.scoreCard, animatedScoreCardStyle]}>
            <View style={[styles.iconBadge, { borderColor: '#FFD700' }]}>
              <Text style={styles.iconText}>⭐</Text>
            </View>
            <Text style={styles.scoreLabel}>Score</Text>
            <Animated.View style={[styles.scoreValueContainer, animatedScoreStyle]}>
              <Text style={styles.scoreValue}>{score}</Text>
              <Text style={styles.scoreMaxText}>pts</Text>
            </Animated.View>
          </Animated.View>
          <View style={styles.questionCard}>
            <View style={[styles.iconBadge, { borderColor: '#7C84E8' }]}>
              <Text style={styles.iconText}>🧩</Text>
            </View>
            <Text style={styles.questionLabel}>Question</Text>
            <Text style={styles.questionValue}>
              <Text style={styles.currentQ}>{index + 1}</Text>
              <Text style={styles.totalQ}>/{total}</Text>
            </Text>
          </View>
        </View>

        {/* Gamified progress bar with segments */}
        <View style={styles.progressBarContainer}>
          {/* Background segments */}
          <View style={styles.segmentsContainer}>
            {Array.from({ length: total }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.segment,
                  { width: `${100 / total}%` }
                ]}
              />
            ))}
          </View>

          {/* Animated fill */}
          <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
            {/* Shimmer overlay */}
            <Animated.View style={[styles.shimmer, animatedShimmerStyle]}>
              <View style={styles.shimmerGradient} />
            </Animated.View>
          </Animated.View>

          {/* Progress dots/milestones */}
          <View style={styles.milestonesContainer}>
            {Array.from({ length: total }).map((_, idx) => {
              const isCompleted = idx < index + 1;
              const isActive = idx === index;
              return (
                <View
                  key={idx}
                  style={[
                    styles.milestone,
                    isCompleted && styles.milestoneCompleted,
                    isActive && styles.milestoneActive,
                  ]}
                >
                  {isCompleted && <View style={styles.milestoneCheck} />}
                </View>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arrange the words</Text>
          <Text style={styles.cardBody}>
            Arrange the words below to form a correct sentence. Tap words to
            build your sentence.
          </Text>
        </View>
        {current.clue && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.clueBox}
        >
          <View style={styles.clueHeader}>
            <Text style={styles.clueIcon}>💡</Text>
            <Text style={styles.clueTitle}>Hint</Text>
          </View>
          <Text style={styles.clueText}>{current.clue}</Text>
        </Animated.View>
      )}

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
            <Animated.View
              entering={SlideInDown.duration(300).springify()}
            >
              <Animated.View
                entering={FadeIn.delay(100).duration(300)}
                style={[styles.feedback, isCorrect ? styles.okBox : styles.badBox]}
              >
                <Text
                  style={[
                    styles.feedbackTitle,
                    isCorrect ? styles.okText : styles.badText,
                  ]}
                >
                  {isCorrect
                    ? `Correct! +${current.points ?? 10} points`
                    : "Incorrect"}
                </Text>
                {!isCorrect && (
                  <Text style={styles.feedbackText}>
                    Correct order: {current.answer}
                  </Text>
                )}
              </Animated.View>
            </Animated.View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 120 }]}>
        <TouchableOpacity
          style={[styles.modernButton, (!locked && selected.length === 0) && { opacity: 0.5 }]}
          onPress={locked ? next : check}
          disabled={!locked && selected.length === 0}
          activeOpacity={0.85}
        >
          <Text style={styles.modernButtonText}>
            {locked ? (last ? "Finish Quiz" : "Next Question") : "Check Answer"}
          </Text>
        </TouchableOpacity>
      </View>
    <ResultModal
      visible={showResult}
      score={correctCount}
      total={total}
      review={review}
      onRequestClose={() => setShowResult(false)}
      title="Congratulations!"
      onContinue={async () => {
      setShowResult(false);
      const finalPercentage = Math.round((correctCount / total) * 100);
      if (finalPercentage >= 70) {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          const progress = stored ? JSON.parse(stored) : {};
          const unlocked = await unlockBadge("sentence", levelId ?? "", progress);

          if (unlocked.length > 0) {
            setNewBadges(unlocked); 
            return;
          }
        } catch (err) {
          console.error("Error unlocking sentence badge:", err);
        }
      } else {
        console.log("Sentence Construction quiz failed — no badges unlocked");
      }
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
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
  content: {
    flexGrow: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  // Modern game header
  gameHeader: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 12,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scoreCard: {
    alignItems: 'center',
    backgroundColor: '#FFFBF0',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    minWidth: 130,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  iconText: {
    fontSize: 16,
  },
  scoreLabel: {
    fontSize: 11,
    color: '#B8860B',
    fontWeight: '700',
    marginBottom: 2,
    marginTop: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#DAA520',
    lineHeight: 40,
    textShadowColor: 'rgba(218, 165, 32, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreMaxText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: 4,
  },
  questionCard: {
    alignItems: 'center',
    backgroundColor: '#5E67CC',
    paddingVertical: 14,
    paddingHorizontal: 26,
    borderRadius: 20,
    minWidth: 130,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#7C84E8',
    position: 'relative',
  },
  questionLabel: {
    fontSize: 11,
    color: '#E8E5FF',
    fontWeight: '700',
    marginBottom: 2,
    marginTop: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  questionValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  currentQ: {
    fontSize: 28,
    fontWeight: '800',
  },
  totalQ: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8E5FF',
  },
  // Gamified progress bar
  progressBarContainer: {
    height: 12,
    marginHorizontal: 20,
    borderRadius: 20,
    position: 'relative',
    marginBottom: 8,
  },
  segmentsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 1,
  },
  segment: {
    height: '100%',
    backgroundColor: '#E8E5FF',
    borderRadius: 6,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#5E67CC',
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  shimmer: {
    position: 'absolute',
    width: '40%',
    height: '100%',
    left: 0,
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
  },
  milestonesContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  milestone: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#E8E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneCompleted: {
    borderColor: '#5E67CC',
    backgroundColor: '#5E67CC',
  },
  milestoneActive: {
    borderColor: '#7C84E8',
    backgroundColor: '#fff',
    borderWidth: 4,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 5,
  },
  milestoneCheck: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  card: {
    borderWidth: 0,
    padding: 24,
    borderRadius: 20,
    backgroundColor: "#fff",
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    color: "#2D2D3A",
    textAlign: 'center',
  },
  cardBody: {
    color: "#6B7280",
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontWeight: "800",
    marginBottom: 12,
    color: "#2D2D3A",
    fontSize: 16
  },

  dashedBox: {
    minHeight: 56,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E8E5FF",
    borderRadius: 16,
    backgroundColor: "#F8F7FF",
    padding: 12,
    justifyContent: "center",
  },
  placeholder: {
    color: "#A0A4AE",
    fontSize: 14,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },

  selChip: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#5E67CC",
    backgroundColor: "#E8E5FF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selChipText: {
    fontWeight: "700",
    color: "#5E67CC",
    fontSize: 15,
  },

  poolChip: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E8E5FF",
    backgroundColor: "#F8F7FF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  poolChipText: {
    fontWeight: "600",
    color: "#2D2D3A",
    fontSize: 15,
  },

  outerPoolBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E5FF",
    borderRadius: 16,
    padding: 12,
    marginTop: 6,
    paddingVertical: 16,
    backgroundColor: "#FCFCFE",
  },
  resetBtn: {
    width: 44,
    height: 44,
    marginLeft: 8,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: '#E8E5FF',
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5E67CC"
  },

  feedback: {
    marginTop: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  okBox: {
    backgroundColor: "#E7F9ED",
  },
  badBox: {
    backgroundColor: "#FFEBEE",
  },
  feedbackTitle: {
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
    fontSize: 16,
  },
  okText: { color: "#1F8F5F" },
  badText: { color: "#C43D3D" },
  feedbackText: {
    color: "#2D2D3A",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  bottomBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
    backgroundColor: "transparent",
  },
  modernButton: {
    backgroundColor: '#5E67CC',
    borderWidth: 0,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    alignItems: 'center',
  },
  modernButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Badge modal styles
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(46,45,70,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "85%",
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalImg: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 8,
    color: '#2D2D3A',
  },
  modalBtn: {
    backgroundColor: "#5E67CC",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: 0.5,
  },
  modalSub: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 12,
    color: "#666",
    fontWeight: '500',
  },
  modalHint: {
    fontSize: 16,
    color: "#5E67CC",
    marginBottom: 20,
    fontWeight: '700',
  },
  clueBox: {
    backgroundColor: "#F8F7FF",
    borderLeftWidth: 4,
    borderLeftColor: "#5E67CC",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  clueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clueIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  clueTitle: {
    color: "#5E67CC",
    fontSize: 15,
    fontWeight: "700",
  },
  clueText: {
    color: "#2D2D3A",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '500',
  },
});