// src/screens/SentenceConstruction/SentenceConstructionGameScreen.tsx
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import auth from "@react-native-firebase/auth";
import { initFirebase } from "../../../../firebaseConfig";

import InstructionCard from "../../../components/InstructionCard";
import SentenceConstructionQuiz from "../../../components/SentenceConstructionQuiz";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal";
import { useMusic } from "../../../context/MusicContext";

type ParamList = {
  SentenceConstructionGame: { levelId?: string };
};

const LEVEL_MAP: Record<string, string> = {
  "easy-1": "A1",
  "easy-2": "A2",
  "medium-1": "B1",
  "medium-2": "B2",
  "hard-1": "C1",
  "hard-2": "C2",
};

// Save quiz result locally & Firestore
async function saveSentenceResult(subId: string, percentage: number) {
  const user = auth().currentUser;
  if (!user) return;

  const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
  const key = `SentenceConstructionProgress_${user.uid}`;
  const stored = await AsyncStorage.getItem(key);
  const progress = stored ? JSON.parse(stored) : {};

  // clamp 0–100
  const finalPct = Math.min(100, Math.max(0, Math.round(percentage)));

  progress[subId] = {
    score: Math.max(progress[subId]?.score ?? 0, finalPct),
    attempted: true,
  };

  await AsyncStorage.setItem(key, JSON.stringify(progress));
  console.log(` Saved SentenceConstruction ${finalPct}% locally for ${subId}`);

  try {
    const { db } = await initFirebase();
    await db.collection("scores").add({
      userId: user.uid,
      levelId: subId,
      quizType: "Sentence Construction",
      score: finalPct,
      totalscore: 100,
      createdAt: (
        await import("@react-native-firebase/firestore")
      ).default.FieldValue.serverTimestamp(),
    });
    console.log("Saved SentenceConstruction score to Firestore");
  } catch (err) {
    console.warn("Could not save sentence score to Firestore:", err);
  }
}

export default function SentenceConstructionGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, "SentenceConstructionGame">>();
  const levelId = route.params?.levelId;

  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });

  const [showExitModal, setShowExitModal] = useState(false);

const { setMode, setShouldPlay } = useMusic();

useEffect(() => {
  setShouldPlay(true);
  setMode("quiz");  

  return () => {
    setMode("home"); 
  };
}, []);


  //  Android back button
  useEffect(() => {
    const backAction = () => {
      if (step === "quiz") {
        setShowExitModal(true);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [step]);

  //  Navigation header
  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        gestureEnabled: false,
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Sentence Construction</Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              {levelId ? `${levelId.replace("trans-", "").toUpperCase()} – ` : ""}
              Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setShowExitModal(true)}
            style={{ marginLeft: 12, flexDirection: "row", alignItems: "center" }}
          >
            <Ionicons name="arrow-back" size={24} />
          </TouchableOpacity>
        ),
      });
    } else {
      navigation.setOptions({
        gestureEnabled: true,
        headerTitle: "Sentence Construction",
        headerLeft: undefined,
      });
    }
  }, [step, progress, levelId]);

  const instructions = {
    title: "Sentence Construction",
    body:
      "Instruction:\n\n" +
      "Arrange the given words to form a correct sentence.\n\n" +
      "Some questions may have cultural or grammatical hints.\n\n" +
      "Only one arrangement is correct.",
    tip: "Tip: Look for capital letters and punctuation clues!",
    titleIcon: require("../../../../assets/Sentence Construction.png"),
    tipIcon: require("../../../../assets/flat-color-icons_idea.png"),
  };

  const currentRoute = (navigation as any).getState().routes.slice(-1)[0].name;

  return (
    <SafeAreaView style={styles.screen}>
      {step === "instructions" ? (
        <InstructionCard
          title={instructions.title}
          body={instructions.body}
          tip={instructions.tip}
          titleIcon={instructions.titleIcon}
          tipIcon={instructions.tipIcon}
          onNext={() => setStep("quiz")}
        />
      ) : (
        <SentenceConstructionQuiz
          levelId={levelId}
          onProgressChange={setProgress}
          onFinish={async (percentage: number) => {
            if (levelId) {
              await saveSentenceResult(levelId, percentage);
            }
          }}
        />
      )}

      <ExitQuizModal
        visible={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onConfirm={() => {
          setShowExitModal(false);
          navigation.goBack();
        }}
      />

      <BottomNav
        currentRoute={currentRoute}
        onNavigate={(name) => navigation.navigate(name as never)}
        inQuiz={step === "quiz"}
        onBlockedNav={() => setShowExitModal(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
});
