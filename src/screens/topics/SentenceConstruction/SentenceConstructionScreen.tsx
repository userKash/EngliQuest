// src/screens/SentenceConstruction/FilipinoToEnglishScreen.tsx
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";

// Reusable list component + types
import LevelList, { LevelDef, ProgressState } from "../../../components/LevelList"; 

const PASSING = 70;

// Difficulty + sublevels (IDs unique to this topic)
const LEVELS: LevelDef[] = [
  {
    key: "easy",
    order: 1,
    title: "Easy",
    description: "Basic sentence construction",
    sublevels: [
      { id: "trans-easy-1", title: "Level 1" },
      { id: "trans-easy-2", title: "Level 2" },
    ],
  },
  {
    key: "medium",
    order: 2,
    title: "Medium",
    description: "Intermediate sentence construction",
    sublevels: [
      { id: "trans-medium-1", title: "Level 1" },
      { id: "trans-medium-2", title: "Level 2" },
    ],
  },
  {
    key: "hard",
    order: 3,
    title: "Hard",
    description: "Advanced sentence construction",
    sublevels: [
      { id: "trans-hard-1", title: "Level 1" },
      { id: "trans-hard-2", title: "Level 2" },
    ],
  },
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
    setStorageKey(`SentenceConstructionProgress_${user.uid}`);
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

  // 🔹 Save progress automatically
  useEffect(() => {
    if (!storageKey) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // 🔹 Unlock rules (linear progression)
  const isUnlocked = (subId: string): boolean => {
    const order = [
      "trans-easy-1",
      "trans-easy-2",
      "trans-medium-1",
      "trans-medium-2",
      "trans-hard-1",
      "trans-hard-2",
    ];
    const idx = order.indexOf(subId);
    if (idx === -1) return false;
    if (idx === 0) return true;

    const prevId = order[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;
    return prevScore >= PASSING;
  };

  // 🔹 Start Sentence Construction quiz
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("SentenceConstructionGame", {
      levelId: subId,
      gameMode: "Sentence Construction",
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
