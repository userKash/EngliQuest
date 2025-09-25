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
import InstructionCard from "../../../components/InstructionCard";
import SentenceConstructionQuiz from "../../../components/SentenceConstructionQuiz";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal";

type ParamList = {
  SentenceConstructionGame: { levelId?: string };
};

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

  // ✅ Handle Android hardware back
  useEffect(() => {
    const backAction = () => {
      if (step === "quiz") {
        setShowExitModal(true);
        return true;
      }
      return false;
    };
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    return () => backHandler.remove();
  }, [step]);

  // ✅ Handle navigation header
  useLayoutEffect(() => {
    if (step === "quiz") {
      navigation.setOptions({
        gestureEnabled: false,
        headerTitle: () => (
          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              Sentence Construction
            </Text>
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