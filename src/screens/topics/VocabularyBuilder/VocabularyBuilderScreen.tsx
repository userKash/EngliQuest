import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";

import LevelList, { LevelDef, ProgressState } from "../../../components/LevelList";

const PASSING = 70;

const LEVELS: LevelDef[] = [
  {
    key: "easy",
    order: 1,
    title: "Easy",
    description: "Basic vocabulary",
    sublevels: [
      { id: "easy-1", title: "Level 1" },
      { id: "easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate vocabulary",
    sublevels: [
      { id: "medium-1", title: "Level 1" },
      { id: "medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced vocabulary",
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

export default function VocabularyBuilderScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load once to set storageKey
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;

    setStorageKey(`VocabularyProgress_${user.uid}`);
  }, []);

  // Reload progress whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!storageKey) return;
      let isActive = true;

      const loadProgress = async () => {
        setLoading(true);
        try {
          const stored = await AsyncStorage.getItem(storageKey);
          if (isActive) {
            setProgress(stored ? JSON.parse(stored) : makeInitialProgress());
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

  // Save automatically when progress changes
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // Best score updater
  const updateBestScore = (subId: string, newScore: number) => {
    setProgress((prev) => {
      const prevScore = prev[subId]?.score ?? 0;
      if (newScore > prevScore) {
        return { ...prev, [subId]: { score: newScore } };
      }
      return prev;
    });
  };

  // Unlock rules: pass ≥ 70% in the previous sublevel
  const isUnlocked = (subId: string): boolean => {
    const idx = SUBLEVELS.indexOf(subId);
    if (idx === -1) return false;

    if (idx === 0) return true; // first level always unlocked

    const prevId = SUBLEVELS[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;

    return prevScore >= PASSING;
  };

  // Overall progress bar
  const contribution = 100 / SUBLEVELS.length;
  const overallProgress = SUBLEVELS.reduce((sum, id) => {
    const score = progress[id]?.score ?? 0;
    return sum + (score / 100) * contribution;
  }, 0);

  // Start or preview a sublevel
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("VocabularyGame", {
      levelId: subId,
      gameMode: "Vocabulary",
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
              💡 Learning Tips
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Start with common words first
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Review words daily
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Use flashcards to remember new terms
            </Text>
          </View>
        }
      />
    </View>
  );
}
