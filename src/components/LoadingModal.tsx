import React, { useEffect, useState } from "react";
import { Modal, View, Text, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

const rotatingMessages = [
  "Generating your quiz...",
  "Almost ready...",
  "Do not close the app",
];

export default function LoadingModal({
  visible,
  message,
}: {
  visible: boolean;
  message?: string;
}) {
  const [currentMessage, setCurrentMessage] = useState(
    message || rotatingMessages[0]
  );

  useEffect(() => {
    if (!visible) return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % rotatingMessages.length;
      setCurrentMessage(message || rotatingMessages[index]);
    }, 2000);

    return () => clearInterval(interval);
  }, [visible, message]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <LottieView
            source={require("../../assets/animations/Books_stack.json")}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />

          <Text style={styles.text}>{currentMessage}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 28,
    borderRadius: 16,
    alignItems: "center",
    width: "75%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    textAlign: "center",
  },
});
