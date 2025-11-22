import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

import ResultModal from "../components/ResultModal";
import { initFirebase } from "../../firebaseConfig";
import { unlockBadge } from "../../badges_utility/badgesutil";
import { BADGES } from "../screens/ProgressScreen";
import type { RootStackParamList } from "../navigation/type";
import { AudioManager } from "../../utils/AudioManager"; 

const STORAGE_KEY = "GrammarProgress";

type GrammarQuestion = {
  explanation: any;
  prompt: string;
  choices: string[];
  correctIndex: number;
  sentence?: string;
  clue?: string;
};

type Props = {
  questions: GrammarQuestion[];
  onFinish?: (finalScore: number, totalQuestions: number) => void;
  onProgressChange?: (p: { current: number; total: number }) => void;
};

export default function GrammarQuiz({
  questions,
  onFinish,
  onProgressChange,
}: Props) {
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const { levelId } = route.params; // "easy" | "med" | "hard"

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>(
    Array(questions.length).fill(-1)
  );
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  // Badge state
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [badgeModal, setBadgeModal] = useState<string | null>(null);

  const choiceLabels = ["A", "B", "C", "D"];
  const question = questions[qIndex];
  const last = qIndex === questions.length - 1;

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-100);

  // Score animation
  const scoreScale = useSharedValue(1);
  const scorePulse = useSharedValue(1);

  useEffect(() => {
    onProgressChange?.({ current: qIndex, total: questions.length });

    // Animate progress bar
    progressWidth.value = withSpring((qIndex + 1) / questions.length, {
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
  }, [qIndex]);

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

const handleSelect = (i: number) => {
  if (selected !== null) return;
  setSelected(i);

  setAnswers((prev) => {
    const copy = [...prev];
    copy[qIndex] = i;
    return copy;
  });

  if (i === question.correctIndex) {
    AudioManager.playCorrectSfx();
    setScore((p) => p + 10);
  } else {
    AudioManager.playWrongSfx();
  }
};


  // --- keep badgeModal in sync with newBadges ---
  useEffect(() => {
    if (newBadges.length > 0) {
      const normalized = newBadges[0].replace(/-\d+$/, "");
      console.log("Opening badge modal for:", normalized);
      setBadgeModal(normalized);
    } else {
      setBadgeModal(null);
    }
  }, [newBadges]);

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
    console.log("Progress saved locally:", progress);

    // badges removed from here
  } catch (err) {
    console.error("Error saving progress:", err);
  }
}



  async function saveScoreToFirestore(
    finalScore: number,
    totalQuestions: number
  ) {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      const uid = user.uid;
      const correctAnswers = finalScore / 10;
      const percentage = Math.round((correctAnswers / totalQuestions) * 100);

      let userName = "Anonymous";
      if (db.collection) {
        const docSnap = await db.collection("users").doc(uid).get();
        if (docSnap.exists) {
          userName = docSnap.data().name || "Anonymous";
        }
      } else {
        const { doc, getDoc } = await import("firebase/firestore");
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          userName = (userDoc.data() as any).name || "Anonymous";
        }
      }

      if (db.collection) {
        const firestore =
          (await import("@react-native-firebase/firestore")).default;
        await db.collection("scores").add({
          userId: uid,
          userName,
          quizType: "Grammar",
          difficulty: levelId,
          userscore: percentage,
          totalscore: 100,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        const { collection, addDoc, serverTimestamp } = await import(
          "firebase/firestore"
        );
        await addDoc(collection(db, "scores"), {
          userId: uid,
          userName,
          quizType: "Grammar",
          difficulty: levelId,
          userscore: percentage,
          totalscore: 100,
          createdAt: serverTimestamp(),
        });
      }

      console.log(
        `Score saved to Firestore: ${percentage}% for user ${userName}`
      );
    } catch (err) {
      console.error("Error saving score:", err);
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

  // --- handle continue after badges ---
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
              <Text style={styles.iconText}>📝</Text>
            </View>
            <Text style={styles.questionLabel}>Question</Text>
            <Text style={styles.questionValue}>
              <Text style={styles.currentQ}>{qIndex + 1}</Text>
              <Text style={styles.totalQ}>/{questions.length}</Text>
            </Text>
          </View>
        </View>

        {/* Gamified progress bar with segments */}
        <View style={styles.progressBarContainer}>
          {/* Background segments */}
          <View style={styles.segmentsContainer}>
            {Array.from({ length: questions.length }).map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.segment,
                  { width: `${100 / questions.length}%` }
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
            {Array.from({ length: questions.length }).map((_, idx) => {
              const isCompleted = idx < qIndex + 1;
              const isActive = idx === qIndex;
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
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
      {question.clue && (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.clueBox}
        >
          <View style={styles.clueHeader}>
            <Text style={styles.clueIcon}>💡</Text>
            <Text style={styles.clueTitle}>Hint</Text>
          </View>
          <Text style={styles.clueText}>{question.clue}</Text>
        </Animated.View>
      )}
  <View style={styles.card}>
  <Text style={styles.prompt}>{question.prompt}</Text>

  {question.choices.map((choice, i) => {
    const correct = question.correctIndex === i;
    const isSelected = selected === i;

    let choiceStyle = styles.choice;
    if (selected !== null) {
      if (correct)
        choiceStyle = { ...choiceStyle, ...styles.correctChoice };
      else if (isSelected)
        choiceStyle = { ...choiceStyle, ...styles.wrongChoice };
    }

    return (
      <Animated.View
        key={i}
        entering={FadeIn.delay(i * 100).duration(400).springify()}
      >
        <TouchableOpacity
          style={choiceStyle}
          onPress={() => handleSelect(i)}
          disabled={selected !== null}
          activeOpacity={0.7}
        >
          <Text style={styles.choiceLabel}>{choiceLabels[i]}</Text>
          <Text style={styles.choiceText}>{choice}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  })}
</View>
{selected !== null && (
  <Animated.View
    style={{ minHeight: 120 }}
    entering={SlideInDown.duration(300).springify()}
  >
    <Animated.View
      entering={FadeIn.delay(100).duration(300)}
      style={[
        styles.feedback,
        selected === question.correctIndex ? styles.okBox : styles.badBox,
      ]}
    >
      <Text
        style={[
          styles.feedbackTitle,
          selected === question.correctIndex ? styles.okText : styles.badText,
        ]}
      >
        {selected === question.correctIndex
          ? "Correct! +10 points"
          : "Incorrect"}
      </Text>
      {selected !== question.correctIndex && (
        <Text style={styles.feedbackText}>
          Correct answer: {question.choices[question.correctIndex]}
        </Text>
      )}
      {question.explanation && (
        <Text style={styles.feedbackText}>{question.explanation}</Text>
      )}
    </Animated.View>
  </Animated.View>
)}


        <View style={{ height: 120 }} />
      </ScrollView>

      {selected !== null && (
        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}
        >
          <TouchableOpacity
            style={styles.modernButton}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.modernButtonText}>
              {last ? "Finish Quiz" : "Next Question"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      <ResultModal
  visible={showResult}
  score={score / 10}
  total={questions.length}
  review={review}
  onRequestClose={() => setShowResult(false)}
  title="Congratulations!"
  onContinue={async () => {
    setShowResult(false);

    const finalScore = score;
    const correctAnswers = finalScore / 10;
    const percentage = Math.round((correctAnswers / questions.length) * 100);

    if (percentage >= 70) {
      console.log("Passed grammar quiz, unlocking badges...");
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const progress = stored ? JSON.parse(stored) : {};
        const unlocked = await unlockBadge("grammar", levelId, progress);
        if (unlocked.length > 0) {
          setNewBadges(unlocked);
          return; 
        }
      } catch (err) {
        console.error("Error unlocking badge after result:", err);
      }
    } else {
      console.log("Grammar quiz failed — no badges unlocked");
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
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
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
  },
  sentence: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 14,
    color: "#555"
  },
  prompt: {
    textAlign: "center",
    fontSize: 20,
    marginBottom: 24,
    fontWeight: "700",
    color: '#2D2D3A',
    lineHeight: 28,
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E8E5FF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    width: "100%",
    backgroundColor: "#F8F7FF",
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  choiceLabel: {
    fontWeight: "800",
    marginRight: 12,
    color: "#5E67CC",
    fontSize: 16,
    backgroundColor: '#E8E5FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 32,
    textAlign: 'center',
  },
  choiceText: {
    fontSize: 15,
    flexShrink: 1,
    color: '#2D2D3A',
    fontWeight: '500',
  },
  correctChoice: {
    backgroundColor: "#E7F9ED",
    borderColor: "#2EB872",
    borderWidth: 3,
    shadowColor: '#2EB872',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  wrongChoice: {
    backgroundColor: "#FFEBEE",
    borderColor: "#F26D6D",
    borderWidth: 3,
    shadowColor: '#F26D6D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  feedbackContainer: {
    borderWidth: 0,
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
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

  explanationBox: {
    marginTop: 12,
    backgroundColor: "#F8F7FF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0,
  },
  explanationTitle: {
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 14,
    color: "#5E67CC",
  },
  explanationText: {
    fontSize: 13,
    color: "#555",
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