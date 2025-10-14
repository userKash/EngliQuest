import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import LevelList, { LevelDef, ProgressState } from "../../../components/LevelList";

const PASSING = 70;

const LEVELS: LevelDef[] = [
  {
    key: "easy",
    order: 1,
    title: "Easy",
    description: "Basic comprehension",
    sublevels: [
      { id: "easy-1", title: "Level 1" },
      { id: "easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate comprehension",
    sublevels: [
      { id: "medium-1", title: "Level 1" },
      { id: "medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced comprehension",
    sublevels: [
      { id: "hard-1", title: "Level 1" },
      { id: "hard-2", title: "Level 2" },
    ],
  },
];

const SUBLEVELS = [
  "easy-1",
  "easy-2",
  "medium-1",
  "medium-2",
  "hard-1",
  "hard-2",
];

// Start fresh
function makeInitialProgress(): ProgressState {
  return {};
}

// Migration helper (if old keys existed)
function migrateKeys(oldProgress: ProgressState): ProgressState {
  const map: Record<string, string> = {
    "read-easy-1": "easy-1",
    "read-easy-2": "easy-2",
    "read-medium-1": "medium-1",
    "read-medium-2": "medium-2",
    "read-hard-1": "hard-1",
    "read-hard-2": "hard-2",
  };
  const migrated: ProgressState = {};
  for (const [k, v] of Object.entries(oldProgress)) {
    const newKey = map[k] || k;
    migrated[newKey] = v;
  }
  return migrated;
}

export default function ReadingComprehensionScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate user-specific storage key
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setStorageKey(`ReadingProgress_${user.uid}`);
  }, []);

  //  Reload progress on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!storageKey) return;
      let isActive = true;

      const loadProgress = async () => {
        setLoading(true);
        try {
          // 1. Load from local storage
          const stored = await AsyncStorage.getItem(storageKey);
          const parsed = stored ? JSON.parse(stored) : makeInitialProgress();
          const migrated = migrateKeys(parsed);

          // 2. Fetch Firestore best scores
          const user = auth().currentUser;
          if (user) {
            const snap = await firestore()
              .collection("scores")
              .where("userId", "==", user.uid)
              .where("quizType", "==", "Reading")
              .get();

            snap.forEach((doc) => {
              const data = doc.data();
              const subId = data.difficulty; // e.g. "easy-1"
              const score = data.userscore ?? 0;
              if (
                subId &&
                (!migrated[subId] || score > (migrated[subId].score ?? 0))
              ) {
                migrated[subId] = { score };
              }
            });
          }

          if (isActive) {
            setProgress(migrated);
            await AsyncStorage.setItem(storageKey, JSON.stringify(migrated));
          }
        } catch {
          if (isActive) setProgress(makeInitialProgress());
        } finally {
          if (isActive) setLoading(false);
        }
      };

      loadProgress();
      return () => {
        isActive = false;
      };
    }, [storageKey])
  );

  //  Save progress automatically
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  //  Best score updater
  const updateBestScore = (subId: string, newScore: number) => {
    setProgress((prev) => {
      const prevScore = prev[subId]?.score ?? 0;
      if (newScore > prevScore) {
        return { ...prev, [subId]: { score: newScore } };
      }
      return prev;
    });
  };

  //  Unlock rules
  const isUnlocked = (subId: string): boolean => {
    const idx = SUBLEVELS.indexOf(subId);
    if (idx === -1) return false;
    if (idx === 0) return true;
    const prevId = SUBLEVELS[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;
    return prevScore >= PASSING;
  };

  //  Overall progress
  const contribution = 100 / SUBLEVELS.length;
  const overallProgress = SUBLEVELS.reduce((sum, id) => {
    const score = progress[id]?.score ?? 0;
    return sum + (score / 100) * contribution;
  }, 0);

  //  Start Reading quiz
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("ReadingGame", {
      levelId: subId,
      gameMode: "Reading Comprehension",
      onFinish: (score: number) => updateBestScore(subId, score),
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading progress...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <LevelList
        levels={LEVELS}
        progress={progress}
        passing={PASSING}
        overallProgress={overallProgress}
        onStartSubLevel={onStartSubLevel}
        isUnlocked={isUnlocked}
        Footer={
          <View
            style={{
              marginTop: 20,
              backgroundColor: "#F6F4FF",
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: "#D0C4F7",
            }}
          >
            <Text style={{ fontSize: 13, marginBottom: 10, color: "#444" }}>
              Complete each level in order. Pass with {PASSING}% to unlock the
              next one.
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              💡 Reading Tips
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Read slowly and carefully
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Highlight key ideas
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Summarize what you read in your own words
            </Text>
          </View>
        }
      />
    </View>
  );
}