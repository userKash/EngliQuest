import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  ScrollView,
} from "react-native";

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

  // Rotation anim per top-level arrow
  const rotations = useRef<Record<TopLevel, Animated.Value>>({
    easy: new Animated.Value(0),
    medium: new Animated.Value(0),
    hard: new Animated.Value(0),
  }).current;

  // Top-level locks from pass rules
  const easyPassed = levelPassed(progress, levels[0], PASSING);
  const mediumPassed = levelPassed(progress, levels[1], PASSING);
  const mediumLocked = !easyPassed;
  const hardLocked = !mediumPassed;

  // expand/collapse for a difficulty and arrow animation
  const toggleExpand = (key: TopLevel) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = !expanded[key];

    Animated.timing(rotations[key], {
      toValue: next ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    setExpanded((prev) => ({ ...prev, [key]: next })); // Save new state
  };

  // Returns a rotation style for the given difficulty's arrow.
  const rotateInterpolate = (key: TopLevel) =>
    rotations[key].interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "90deg"],
    });

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
      {/* Overall Progress Bar */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Your Progress</Text>
        <Text style={styles.progressText}>
          {overallProgress.toFixed(1)}% completed
        </Text>

        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(overallProgress, 100)}%` },
            ]}
          />
        </View>
      </View>

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
                    { transform: [{ rotate: rotateInterpolate(lvl.key) }] },
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
  scrollContent: { padding: 20, paddingBottom: 80 },

  progressCard: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  progressTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  progressText: { fontSize: 14, color: "#666", marginBottom: 8 },
  progressBarBg: {
    height: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#5E67CC",
  },

  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  levelLocked: { opacity: 0.5 },
  levelCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E5E7FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  levelNumber: { fontWeight: "bold", color: "#5E67CC", fontSize: 16 },
  levelTitle: { fontWeight: "bold", fontSize: 16 },
  levelDesc: { fontSize: 13, color: "#777" },

  subLevelCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    padding: 14,
    marginLeft: 10,
    marginBottom: 10,
    backgroundColor: "#f9f9f9",
  },
  subLevelTitle: { fontWeight: "600", fontSize: 15 },
  subLevelDesc: { fontSize: 12, color: "#777" },

  badge: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#555",
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  lockedText: { fontSize: 12, color: "#999" },

  startButton: {
    backgroundColor: "#5E67CC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  arrowIcon: { width: 17, height: 17, tintColor: "#fff", marginRight: 6 },
  startButtonText: { color: "#fff", fontSize: 13 },
  buttonDisabled: { backgroundColor: "#ccc" },
});