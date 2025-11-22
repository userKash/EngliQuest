import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';

// enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type TopLevel = "easy" | "medium" | "hard";
export type SubLevel = { id: string; title: string };

// Structure for each difficulty
export type LevelDef = {
  key: TopLevel;
  order: number;
  title: string;
  description: string;
  sublevels: SubLevel[];
};

// to track each sublevel progress
export type SubLevelProgress = {
  score?: number; // best score 0-100
  attempted?: boolean; // played at least once
};
export type ProgressState = Record<string, SubLevelProgress>; // Store progress for all sublevels

type Props = {
  levels: LevelDef[];
  progress: ProgressState;
  passing?: number; // default 70
  onStartSubLevel: (subId: string) => void; // parent handles navigation
  Footer?: React.ReactNode; // optional footer (tips, etc.)
  isUnlocked?: (subId: string) => boolean;
  overallProgress?: number; // 🔹 added: overall % across all sublevels
};

// helpers (kept here so the component is portable)
function subLevelBadge(progress?: SubLevelProgress, PASSING = 70) {
  if (!progress || !progress.attempted) return "Not Started";
  return (progress.score ?? 0) >= PASSING ? "Completed" : "In Progress";
}
function levelPassed(progress: ProgressState, level: LevelDef, PASSING = 70) {
  return level.sublevels.every(
    (sub) => (progress[sub.id]?.score ?? 0) >= PASSING
  );
}
function isSubLevelUnlocked(
  def: LevelDef,
  subIndex: number,
  progress: ProgressState,
  PASSING = 70
) {
  if (subIndex === 0) return true;
  const prevId = def.sublevels[subIndex - 1].id;
  const prevScore = progress[prevId]?.score ?? 0;
  return prevScore >= PASSING;
}

export default function LevelList({
  levels,
  progress,
  passing = 70,
  onStartSubLevel,
  Footer,
  overallProgress = 0,
}: Props) {
  const PASSING = passing;

  // show and hide the sublevel
  const [expanded, setExpanded] = useState<Record<TopLevel, boolean>>({
    easy: false,
    medium: false,
    hard: false,
  });

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  const shimmerTranslate = useSharedValue(-100);

  // Rotation animations using Reanimated
  const easyRotation = useSharedValue(0);
  const mediumRotation = useSharedValue(0);
  const hardRotation = useSharedValue(0);

  // Top-level locks from pass rules
  const easyPassed = levelPassed(progress, levels[0], PASSING);
  const mediumPassed = levelPassed(progress, levels[1], PASSING);
  const mediumLocked = !easyPassed;
  const hardLocked = !mediumPassed;

  // Animate progress bar on mount
  useEffect(() => {
    progressWidth.value = withSpring(overallProgress / 100, {
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
  }, [overallProgress]);

  // Get the appropriate rotation value for a level
  const getRotation = (key: TopLevel) => {
    if (key === 'easy') return easyRotation;
    if (key === 'medium') return mediumRotation;
    return hardRotation;
  };

  // expand/collapse for a difficulty and arrow animation
  const toggleExpand = (key: TopLevel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded[key];
    const rotation = getRotation(key);

    rotation.value = withSpring(next ? 90 : 0, {
      damping: 15,
      stiffness: 150,
    });

    setExpanded((prev) => ({ ...prev, [key]: next }));
  };

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

  // Rotation styles for arrows
  const easyRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${easyRotation.value}deg` }],
  }));

  const mediumRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${mediumRotation.value}deg` }],
  }));

  const hardRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${hardRotation.value}deg` }],
  }));

  // Get rotation style for a level
  const getRotationStyle = (key: TopLevel) => {
    if (key === 'easy') return easyRotationStyle;
    if (key === 'medium') return mediumRotationStyle;
    return hardRotationStyle;
  };

  // Starts the selected sublevel if it’s unlocked; otherwise, does nothing
  const handleStart = (subId: string) => {
    const level = levels.find((lvl) =>
      lvl.sublevels.some((sub) => sub.id === subId)
    );
    if (!level) return; // guard: subId not found

    const subIndex = level.sublevels.findIndex((sub) => sub.id === subId);

    // Determine if the sublevel is locked (parent difficulty locked or previous sublevel not passed)
    const isLocked =
      (level.key === "medium" && mediumLocked) ||
      (level.key === "hard" && hardLocked) ||
      !isSubLevelUnlocked(level, subIndex, progress, PASSING);

    // Stop here if locked
    if (isLocked) return;

    onStartSubLevel(subId);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Overall Progress Card - Gamified */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <View style={styles.progressIconBadge}>
            <Text style={styles.progressIcon}>🎯</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.progressTitle}>Your Progress</Text>
            <Text style={styles.progressSubtitle}>Keep learning, you're doing great!</Text>
          </View>
        </View>

        <View style={styles.progressStatsRow}>
          <Text style={styles.progressPercentage}>{overallProgress.toFixed(0)}%</Text>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>

        {/* Gamified Progress Bar with shimmer */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, animatedProgressStyle]}>
              {/* Shimmer overlay */}
              <Animated.View style={[styles.shimmer, animatedShimmerStyle]}>
                <View style={styles.shimmerGradient} />
              </Animated.View>
            </Animated.View>
          </View>
        </View>
      </Animated.View>

      {/* Levels + Sublevels */}
      {levels.map((lvl) => {
        const isMedium = lvl.key === "medium";
        const isHard = lvl.key === "hard";
        const locked = (isMedium && mediumLocked) || (isHard && hardLocked);

        return (
          <View key={lvl.key}>
            {/* Top-level card */}
            <View
              style={[styles.levelCard, locked && styles.levelLocked]}
              accessible
              accessibilityLabel={`${lvl.title} level ${
                locked ? "locked" : "unlocked"
              }`}
            >
              <View style={styles.levelCircle}>
                <Text style={styles.levelNumber}>{lvl.order}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.levelTitle}>
                  {lvl.title}{" "}
                  <Text style={locked ? styles.lockedText : styles.badge}>
                    {locked
                      ? "🔒 Locked"
                      : levelPassed(progress, lvl, PASSING)
                      ? "Completed"
                      : "Available"}
                  </Text>
                </Text>
                <Text style={styles.levelDesc}>{lvl.description}</Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.startButton, locked && styles.buttonDisabled]}
                disabled={locked}
                onPress={() => toggleExpand(lvl.key)}
                accessibilityRole="button"
                accessibilityLabel={`${
                  expanded[lvl.key] ? "Hide" : "Show"
                } ${lvl.title} sub-levels`}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Animated.Image
                  source={require("../../assets/arrow.png")}
                  style={[
                    styles.arrowIcon,
                    getRotationStyle(lvl.key),
                  ]}
                />
                <Text style={styles.startButtonText}>
                  {expanded[lvl.key] ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sub-levels */}
            {expanded[lvl.key] && !locked && (
              <View style={{ marginTop: -6, marginBottom: 8 }}>
                {lvl.sublevels.map((s, idx) => {
                  const p = progress[s.id];
                  const badgeText = subLevelBadge(p, PASSING);
                  const passed = (p?.score ?? 0) >= PASSING;
                  const subUnlocked = isSubLevelUnlocked(
                    lvl,
                    idx,
                    progress,
                    PASSING
                  );

                  return (
                    <View
                      key={s.id}
                      style={[
                        styles.subLevelCard,
                        !subUnlocked && { opacity: 0.6 },
                      ]}
                      accessible
                      accessibilityLabel={`${s.title}, ${badgeText}${
                        !subUnlocked ? ", Locked" : ""
                      }`}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.subLevelTitle}>
                          {s.title} <Text style={styles.badge}>{badgeText}</Text>
                        </Text>
                        <Text style={styles.subLevelDesc}>
                          {lvl.description}
                          {typeof p?.score === "number"
                            ? ` • Best score: ${p.score}%`
                            : ""}
                        </Text>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={[
                          styles.startButton,
                          !subUnlocked && styles.buttonDisabled,
                        ]}
                        disabled={!subUnlocked}
                        onPress={() => handleStart(s.id)}
                        accessibilityRole="button"
                        accessibilityLabel={
                          !subUnlocked
                            ? `Locked ${s.title}`
                            : `${passed ? "Review" : p?.attempted ? "Continue" : "Start"} ${s.title}`
                        }
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Image
                          source={require("../../assets/arrow.png")}
                          style={styles.arrowIcon}
                        />
                        <Text style={styles.startButtonText}>
                          {!subUnlocked
                            ? "Locked"
                            : passed
                            ? "Review"
                            : p?.attempted
                            ? "Continue"
                            : "Start"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        );
      })}

      {/* Tips footer (optional) */}
      {Footer}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 20,
    paddingBottom: 80,
  },

  // Progress Card - Gamified
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 0,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8E5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 3,
    borderColor: '#5E67CC',
  },
  progressIcon: {
    fontSize: 24,
  },
  progressTitle: {
    fontWeight: "800",
    fontSize: 18,
    color: '#2D2D3A',
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  progressStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 40,
    fontWeight: '900',
    color: '#5E67CC',
    marginRight: 8,
    lineHeight: 44,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7C84E8',
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 14,
    backgroundColor: "#E8E5FF",
    borderRadius: 20,
    overflow: "hidden",
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    height: "100%",
    backgroundColor: "#5E67CC",
    borderRadius: 20,
    overflow: 'hidden',
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

  // Level Card - Gamified
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    backgroundColor: "#fff",
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  levelLocked: {
    opacity: 0.65,
  },
  levelCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#5E67CC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 3,
    borderColor: '#7C84E8',
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  levelNumber: {
    fontWeight: "900",
    color: "#fff",
    fontSize: 20,
  },
  levelTitle: {
    fontWeight: "800",
    fontSize: 17,
    color: '#2D2D3A',
    marginBottom: 4,
  },
  levelDesc: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: '500',
  },

  // Sub-Level Card - Gamified
  subLevelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 16,
    padding: 16,
    marginLeft: 12,
    marginRight: 4,
    marginBottom: 12,
    backgroundColor: "#F8F7FF",
    borderLeftWidth: 4,
    borderLeftColor: '#5E67CC',
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  subLevelTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: '#2D2D3A',
    marginBottom: 4,
  },
  subLevelDesc: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: '500',
  },

  // Badge - Gamified
  badge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#5E67CC",
    backgroundColor: "#E8E5FF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0CDFF',
    overflow: 'hidden',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lockedText: {
    fontSize: 11,
    color: "#999",
    fontWeight: '600',
  },

  // Start Button - Gamified
  startButton: {
    backgroundColor: "#5E67CC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#5E67CC',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 0,
  },
  arrowIcon: {
    width: 18,
    height: 18,
    tintColor: "#fff",
    marginRight: 6,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0.1,
  },
});