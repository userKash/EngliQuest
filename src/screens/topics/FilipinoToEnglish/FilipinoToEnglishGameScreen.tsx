import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import InstructionCard from "../../../components/InstructionCard";
import FilipinoToEnglishQuiz from "../../../components/FilipinoToEnglishQuiz";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import ExitQuizModal from "../../../components/ExitQuizModal"; // 👈 shared modal

export default function FilipinoToEnglishGameScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<"instructions" | "quiz">("instructions");
  const [progress, setProgress] = useState<{ current: number; total: number }>(
    { current: 0, total: 1 }
  );

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
              Filipino to English
            </Text>
            <Text style={{ fontSize: 12, color: "#555" }}>
              Easy – Question {progress.current + 1} of {progress.total}
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
        headerTitle: "Filipino to English",
        headerLeft: undefined,
      });
    }
  }, [step, progress]);

  const instructions = {
    title: "Filipino to English",
    body:
      "Instruction:\n\n" +
      "Read the Filipino word or short phrase.\n\n" +
      "Type its correct English translation.\n\n" +
      "Answers must be spelled correctly to be marked correct.",
    tip: "Tip: Think of common English phrases. No need for full sentences!",
    titleIcon: require("../../../../assets/Filipino to English.png"),
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
        <FilipinoToEnglishQuiz onProgressChange={setProgress} />
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
