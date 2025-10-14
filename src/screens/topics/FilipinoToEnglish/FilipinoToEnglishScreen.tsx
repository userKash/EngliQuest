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

function makeInitialProgress(): ProgressState {
  return {};
}

export default function FilipinoToEnglishScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({});
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create per-user storage key
  useEffect(() => {
    const user = auth().currentUser;
    if (user) setStorageKey(`TranslationProgress_${user.uid}`);
  }, []);

  // Load progress on focus
  useFocusEffect(
    useCallback(() => {
      if (!storageKey) return;
      let active = true;

      const loadProgress = async () => {
        setLoading(true);
        try {
          const stored = await AsyncStorage.getItem(storageKey);
          const parsed = stored ? JSON.parse(stored) : makeInitialProgress();
          if (active) setProgress(parsed);
        } catch {
          if (active) setProgress(makeInitialProgress());
        } finally {
          if (active) setLoading(false);
        }
      };

      loadProgress();
      return () => {
        active = false;
      };
    }, [storageKey])
  );

  // Auto-save progress
  useEffect(() => {
    if (storageKey) AsyncStorage.setItem(storageKey, JSON.stringify(progress));
  }, [progress, storageKey]);

  // Update best score after quiz
  const updateBestScore = (subId: string, newScore: number) => {
    setProgress((prev) => {
      const prevScore = prev[subId]?.score ?? 0;
      if (newScore > prevScore) {
        return { ...prev, [subId]: { score: newScore } };
      }
      return prev;
    });
  };

  //  Unlock next level if previous one passed
  const isUnlocked = (subId: string): boolean => {
    const idx = SUBLEVELS.indexOf(subId);
    if (idx === -1) return false;
    if (idx === 0) return true;

    const prevId = SUBLEVELS[idx - 1];
    const prevScore = progress[prevId]?.score ?? 0;
    return prevScore >= PASSING;
  };

  // Compute overall progress
  const contribution = 100 / SUBLEVELS.length;
  const overallProgress = SUBLEVELS.reduce((sum, id) => {
    const score = progress[id]?.score ?? 0;
    return sum + (score / 100) * contribution;
  }, 0);

  //  Launch a quiz sublevel
  const onStartSubLevel = (subId: string) => {
    if (!isUnlocked(subId)) return;
    navigation.navigate("FilipinoToEnglishGame", {
      levelId: subId,
      gameMode: "Translation",
      onFinish: (score: number) => {
        updateBestScore(subId, score);

        //  Auto-unlock next level if passed
        if (score >= PASSING) {
          const nextIdx = SUBLEVELS.indexOf(subId) + 1;
          if (nextIdx < SUBLEVELS.length) {
            const nextId = SUBLEVELS[nextIdx];
            setProgress((prev) => ({
              ...prev,
              [nextId]: prev[nextId] ?? { score: 0 },
            }));
          }
        }
      },
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
