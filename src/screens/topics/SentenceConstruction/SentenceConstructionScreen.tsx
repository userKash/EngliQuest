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
    description: "Basic sentence construction",
    sublevels: [
      { id: "sc-easy-1", title: "Level 1" },
      { id: "sc-easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate sentence construction",
    sublevels: [
      { id: "sc-medium-1", title: "Level 1" },
      { id: "sc-medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced sentence construction",
    sublevels: [
      { id: "sc-hard-1", title: "Level 1" },
      { id: "sc-hard-2", title: "Level 2" },
    ],
  },
];

const SUBLEVELS = [
  "sc-easy-1",
  "sc-easy-2",
  "sc-medium-1",
  "sc-medium-2",
  "sc-hard-1",
  "sc-hard-2",
];

// Start fresh
function makeInitialProgress(): ProgressState {
  return {};
}

// Migration helper (keep old progress from trans-* or sentence-*)
function migrateKeys(oldProgress: ProgressState): ProgressState {
  const map: Record<string, string> = {
    // old FilipinoToEnglish "trans-" -> Sentence Construction "sc-"
    "trans-easy-1": "sc-easy-1",
    "trans-easy-2": "sc-easy-2",
    "trans-medium-1": "sc-medium-1",
    "trans-medium-2": "sc-medium-2",
    "trans-hard-1": "sc-hard-1",
    "trans-hard-2": "sc-hard-2",

    // even older "sentence-" naming
    "sentence-easy-1": "sc-easy-1",
    "sentence-easy-2": "sc-easy-2",
    "sentence-medium-1": "sc-medium-1",
    "sentence-medium-2": "sc-medium-2",
    "sentence-hard-1": "sc-hard-1",
    "sentence-hard-2": "sc-hard-2",
  };

  const migrated: ProgressState = {};
  for (const [k, v] of Object.entries(oldProgress)) {
    const newKey = map[k] || k;
    migrated[newKey] = v;
  }

  if (Object.keys(migrated).length > 0) {
    console.log(" Migrated progress keys:", migrated);
  }

  return migrated;
}

export default function SentenceConstructionScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  //  Generate user-specific storage key
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setStorageKey(`SentenceConstructionProgress_${user.uid}`);
  }, []);

  //  Reload progress on focus
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
              .where("quizType", "==", "SentenceConstruction")
              .get();

            snap.forEach((doc) => {
              const data = doc.data();
              const subId = data.difficulty; // e.g. "sc-easy-1"
              const score = data.userscore ?? 0;

              if (!migrated[subId] || score > (migrated[subId].score ?? 0)) {
                migrated[subId] = { score };
              }
            });
          }

          if (isActive) {
            setProgress(migrated);
            await AsyncStorage.setItem(storageKey, JSON.stringify(migrated));
          }
        } catch (err) {
          console.error("❌ Error loading Sentence Construction progress:", err);
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

  //  Start Sentence Construction quiz
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("SentenceConstructionGame", {
      levelId: subId,
      gameMode: "Sentence Construction",
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
              Complete each level in order. Pass with {PASSING}% to unlock the next one.
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              💡 Sentence Construction Tips
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Start with simple subjects and verbs
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Pay attention to word order
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Add objects and complements step by step
            </Text>
          </View>
        }
      />
    </View>
  );
}