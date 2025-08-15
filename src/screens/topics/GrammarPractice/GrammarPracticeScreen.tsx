import { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // to save progress
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/type';
import BottomNav from '../../../components/BottomNav';

// enable LayoutAnimation on Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const STORAGE_KEY = 'grammarProgress'; // key for storage

const PASSING = 70;

// to track each sublevel progress
type SubLevelProgress = {
  score?: number; // best score 0-100
  attempted?: boolean; // played at least once
};
function subLevelBadge(progress?: SubLevelProgress) {
  if (!progress || !progress.attempted) {
    return 'Not Started';
  }

  if ((progress.score || 0) >= PASSING) {
    return 'Completed';
  }

  return 'In Progress';
}

type ProgressState = Record<string, SubLevelProgress>; // Store progress for all sublevels

type TopLevel = 'easy' | 'medium' | 'hard'; // types
type SubLevel = { id: string; title: string };

// Structure for each difficulty
type LevelDef = {
  key: TopLevel;
  order: number;
  title: string;
  description: string;
  sublevels: SubLevel[];
};

//  Difficulty and Sublevel definition
const LEVELS: LevelDef[] = [
  {
    key: 'easy',
    order: 1,
    title: 'Easy',
    description: 'Basic level',
    sublevels: [
      { id: 'easy-1', title: 'Level 1' },
      { id: 'easy-2', title: 'Level 2' },
    ],
  },
  {
    key: 'medium',
    order: 2,
    title: 'Medium',
    description: 'Intermediate level',
    sublevels: [
      { id: 'medium-1', title: 'Level 1' },
      { id: 'medium-2', title: 'Level 2' },
    ],
  },
  {
    key: 'hard',
    order: 3,
    title: 'Hard',
    description: 'Advanced level',
    sublevels: [
      { id: 'hard-1', title: 'Level 1' },
      { id: 'hard-2', title: 'Level 2' },
    ],
  },
];

// count the levels unlock
function countTopLevelsPassed(progress: ProgressState) {
  let count = 0;
  for (let level of LEVELS) {
    if (levelPassed(progress, level)) {
      count++;
    }
  }
  return count;
}
// check if all sublevel unlock to unlock next level
function levelPassed(progress: ProgressState, level: LevelDef) {
  for (let sub of level.sublevels) {
    const score = progress[sub.id]?.score ?? 0;
    if (score < PASSING) return false; // Found one that isn't passed
  }
  return true; // All passed
}
function isSubLevelUnlocked(def: LevelDef, subIndex: number, progress: ProgressState) {
  if (subIndex === 0) return true;
  const prevId = def.sublevels[subIndex - 1].id;
  const prevScore = progress[prevId]?.score ?? 0;
  return prevScore >= PASSING; // Unlock if previous is passed
}
// Start with an empty progress object for new users
function makeInitialProgress(): ProgressState {
  return {};
}
export default function GrammarPracticeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [progress, setProgress] = useState<ProgressState>({}); // Track all progress

  // On first load, get saved progress from AsyncStorage.
  // If none is found, start with empty progress.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setProgress(stored ? (JSON.parse(stored) as ProgressState) : makeInitialProgress());
      } catch {
        setProgress(makeInitialProgress());
      }
    })();
  }, []);
  // Refresh on focus (returning from game)
  useFocusEffect(
    useMemo(
      () => () => {
        (async () => {
          try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) setProgress(JSON.parse(stored) as ProgressState);
          } catch {
            // ignore parse errors
          }
        })();
      },
      []
    )
  );

  //show and hide the sublevel
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
  const easyPassed = levelPassed(progress, LEVELS[0]);
  const mediumPassed = levelPassed(progress, LEVELS[1]);
  const mediumLocked = !easyPassed;
  const hardLocked = !mediumPassed;

  const completedTopLevels = countTopLevelsPassed(progress); // How many top levels are finished
  const totalTopLevels = LEVELS.length; // How many top levels exist in total

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
      outputRange: ['0deg', '90deg'],
    });

  // Starts the selected sublevel if it’s unlocked; otherwise, does nothing
  const onStartSubLevel = (subId: string) => {
    const level = LEVELS.find((lvl) => lvl.sublevels.some((sub) => sub.id === subId));
    if (!level) return; // guard: subId not found

    const subIndex = level.sublevels.findIndex((sub) => sub.id === subId);

    // Determine if the sublevel is locked (parent difficulty locked or previous sublevel not passed)
    const isLocked =
      (level.key === 'medium' && mediumLocked) ||
      (level.key === 'hard' && hardLocked) ||
      !isSubLevelUnlocked(level, subIndex, progress);

    // Stop here if locked
    if (isLocked) return;

    navigation.navigate('GrammarGame', { levelId: subId });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Your Progress</Text>
          <Text style={styles.progressText}>
            {completedTopLevels} of {totalTopLevels} levels completed
          </Text>
          <View
            style={styles.progressDots}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={`Completed ${completedTopLevels} of ${totalTopLevels} levels`}>
            {Array.from({ length: totalTopLevels }).map((_, i) => (
              <View key={i} style={[styles.dot, i < completedTopLevels && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Levels + Sublevels */}
        {LEVELS.map((lvl) => {
          const isMedium = lvl.key === 'medium';
          const isHard = lvl.key === 'hard';
          const locked = (isMedium && mediumLocked) || (isHard && hardLocked);

          return (
            <View key={lvl.key}>
              {/* Top-level card */}
              <View
                style={[styles.levelCard, locked && styles.levelLocked]}
                accessible
                accessibilityLabel={`${lvl.title} level ${locked ? 'locked' : 'unlocked'}`}>
                <View style={styles.levelCircle}>
                  <Text style={styles.levelNumber}>{lvl.order}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.levelTitle}>
                    {lvl.title}{' '}
                    <Text style={locked ? styles.lockedText : styles.badge}>
                      {locked
                        ? '🔒 Locked'
                        : levelPassed(progress, lvl)
                          ? 'Completed'
                          : 'Available'}
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
                  accessibilityLabel={`${expanded[lvl.key] ? 'Hide' : 'Show'} ${lvl.title} sub-levels`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Animated.Image
                    source={require('../../../../assets/arrow.png')}
                    style={[
                      styles.arrowIcon,
                      { transform: [{ rotate: rotateInterpolate(lvl.key) }] },
                    ]}
                  />
                  <Text style={styles.startButtonText}>{expanded[lvl.key] ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>

              {/* Sub-levels */}
              {expanded[lvl.key] && !locked && (
                <View style={{ marginTop: -6, marginBottom: 8 }}>
                  {lvl.sublevels.map((s, idx) => {
                    const p = progress[s.id];
                    const badgeText = subLevelBadge(p);
                    const passed = (p?.score ?? 0) >= PASSING;
                    const subUnlocked = isSubLevelUnlocked(lvl, idx, progress);

                    return (
                      <View
                        key={s.id}
                        style={[styles.subLevelCard, !subUnlocked && { opacity: 0.6 }]}
                        accessible
                        accessibilityLabel={`${s.title}, ${badgeText}${!subUnlocked ? ', Locked' : ''}`}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subLevelTitle}>
                            {s.title} <Text style={styles.badge}>{badgeText}</Text>
                          </Text>
                          <Text style={styles.subLevelDesc}>
                            {lvl.description}
                            {typeof p?.score === 'number' ? ` • Best score: ${p.score}%` : ''}
                          </Text>
                        </View>

                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={[styles.startButton, !subUnlocked && styles.buttonDisabled]}
                          disabled={!subUnlocked}
                          onPress={() => onStartSubLevel(s.id)}
                          accessibilityRole="button"
                          accessibilityLabel={
                            !subUnlocked
                              ? `Locked ${s.title}`
                              : `${passed ? 'Review' : p?.attempted ? 'Continue' : 'Start'} ${s.title}`
                          }
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Image
                            source={require('../../../../assets/arrow.png')}
                            style={styles.arrowIcon}
                          />
                          <Text style={styles.startButtonText}>
                            {!subUnlocked
                              ? 'Locked'
                              : passed
                                ? 'Review'
                                : p?.attempted
                                  ? 'Continue'
                                  : 'Start'}
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

        <View style={styles.tipsCard}>
          <Text style={styles.tipsText}>
            Complete each level in order. Pass Easy, Medium, and Hard with {PASSING}% to unlock the
            next level.
          </Text>
          <Text style={styles.tip}>💡 Learning Tips</Text>
          <Text style={styles.tip}>• Start with Easy level to build confidence</Text>
          <Text style={styles.tip}>• Practice regularly for better retention</Text>
          <Text style={styles.tip}>• Complete all levels to master the skill</Text>
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { padding: 20, paddingBottom: 80 },

  progressCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  progressTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  progressText: { fontSize: 14, color: '#666' },
  progressDots: { flexDirection: 'row', marginTop: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ddd', marginRight: 6 },
  dotActive: { backgroundColor: '#5E67CC' },

  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  levelLocked: { opacity: 0.5 },
  levelCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  levelNumber: { fontWeight: 'bold', color: '#5E67CC', fontSize: 16 },
  levelTitle: { fontWeight: 'bold', fontSize: 16 },
  levelDesc: { fontSize: 13, color: '#777' },

  subLevelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 14,
    marginLeft: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  subLevelTitle: { fontWeight: '600', fontSize: 15 },
  subLevelDesc: { fontSize: 12, color: '#777' },

  badge: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#555',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  lockedText: { fontSize: 12, color: '#999' },

  startButton: {
    backgroundColor: '#5E67CC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  arrowIcon: { width: 17, height: 17, tintColor: '#fff', marginRight: 6 },
  startButtonText: { color: '#fff', fontSize: 13 },
  buttonDisabled: { backgroundColor: '#ccc' },

  tipsCard: {
    marginTop: 20,
    backgroundColor: '#F6F4FF',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D0C4F7',
  },
  tipsText: { fontSize: 13, marginBottom: 10, color: '#444' },
  tip: { fontSize: 13, color: '#555', marginBottom: 6 },
});
