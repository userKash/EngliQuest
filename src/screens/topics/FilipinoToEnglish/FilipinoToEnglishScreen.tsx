// src/screens/Translation/FilipinoToEnglishScreen.tsx
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
    description: "Basic translation",
    sublevels: [
      { id: "trans-easy-1", title: "Level 1" },
      { id: "trans-easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate translation",
    sublevels: [
      { id: "trans-medium-1", title: "Level 1" },
      { id: "trans-medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced translation",
    sublevels: [
      { id: "trans-hard-1", title: "Level 1" },
      { id: "trans-hard-2", title: "Level 2" },
    ],
  },
];

const SUBLEVELS = [
  "trans-easy-1",
  "trans-easy-2",
  "trans-medium-1",
  "trans-medium-2",
  "trans-hard-1",
  "trans-hard-2",
];

// Start fresh
function makeInitialProgress(): ProgressState {
  return {};
}

export default function FilipinoToEnglishScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Generate user-specific storage key
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setStorageKey(`TranslationProgress_${user.uid}`);
  }, []);

  // 🔹 Reload progress on screen focus
  useFocusEffect(
    useCallback(() => {
      if (!storageKey) return;
      let isActive = true;

      const loadProgress = async () => {
        setLoading(true);
        try {
          // 1. Load local storage
          const stored = await AsyncStorage.getItem(storageKey);
          const parsed = stored ? JSON.parse(stored) : makeInitialProgress();

          // 2. Fetch Firestore best scores
          const user = auth().currentUser;
          if (user) {
            const snap = await firestore()
              .collection("scores")
              .where("userId", "==", user.uid)
              .where("quizType", "==", "Translation")
              .get();

            snap.forEach((doc) => {
              const data = doc.data();
              const subId = data.difficulty; // e.g. "trans-easy-1"
              const score = data.userscore ?? 0;

              if (!parsed[subId] || score > (parsed[subId].score ?? 0)) {
                parsed[subId] = { score };
              }
            });
          }

          if (isActive) {
            setProgress(parsed);
            await AsyncStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } catch (e) {
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

  // 🔹 Save whenever progress changes
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // 🔹 Best score updater
  const updateBestScore = (subId: string, newScore: number) => {
    setProgress((prev) => {
      const prevScore = prev[subId]?.score ?? 0;
      if (newScore > prevScore) {
        return { ...prev, [subId]: { score: newScore } };
      }
      return prev;
    });
  };

  // 🔹 Unlock rules
  const isUnlocked = (subId: string): boolean => {
    const idx = SUBLEVELS.indexOf(subId);
    if (idx === -1) return false;
    if (idx === 0) return true;

    const prevId = SUBLEVELS[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;
    return prevScore >= PASSING;
  };

  // 🔹 Overall progress calculation
  const contribution = 100 / SUBLEVELS.length;
  const overallProgress = SUBLEVELS.reduce((sum, id) => {
    const score = progress[id]?.score ?? 0;
    return sum + (score / 100) * contribution;
  }, 0);

  // 🔹 Start Translation quiz
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("FilipinoToEnglishGame", {
      levelId: subId,
      gameMode: "Translation",
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
        overallProgress={overallProgress} // ✅ now showing progress %
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
              Translate Filipino to English. Pass each level with {PASSING}% to unlock the next.
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>💡 Translation Tips</Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Translate simple words first
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Practice with everyday sentences
            </Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
              • Check meanings using a dictionary
            </Text>
          </View>
        }
      />
    </View>
  );
}
