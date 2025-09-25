// src/screens/Reading/ReadingComprehensionScreen.tsx
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
    description: "Basic comprehension",
    sublevels: [
      { id: "read-easy-1", title: "Level 1" },
      { id: "read-easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate comprehension",
    sublevels: [
      { id: "read-medium-1", title: "Level 1" },
      { id: "read-medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced comprehension",
    sublevels: [
      { id: "read-hard-1", title: "Level 1" },
      { id: "read-hard-2", title: "Level 2" },
    ],
  },
];

// Start fresh
function makeInitialProgress(): ProgressState {
  return {};
}

export default function ReadingComprehensionScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔹 Generate user-specific storage key
  useEffect(() => {
    const user = auth().currentUser;
    if (!user) return;
    setStorageKey(`ReadingProgress_${user.uid}`);
  }, []);

  // 🔹 Reload progress on screen focus
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

  // 🔹 Save whenever progress changes
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // 🔹 Unlock rules (same as grammar)
  const isUnlocked = (subId: string): boolean => {
    const order = [
      "read-easy-1",
      "read-easy-2",
      "read-medium-1",
      "read-medium-2",
      "read-hard-1",
      "read-hard-2",
    ];
    const idx = order.indexOf(subId);
    if (idx === -1) return false;
    if (idx === 0) return true;

    const prevId = order[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;
    return prevScore >= PASSING;
  };

  // 🔹 Start Reading quiz
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("ReadingGame", { levelId: subId, gameMode: "Reading Comprehension" });
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
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>💡 Reading Tips</Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>• Read slowly and carefully</Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>• Highlight key ideas</Text>
            <Text style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>• Summarize what you read in your own words</Text>
          </View>
        }
      />
    </View>
  );
}
