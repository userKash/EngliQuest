import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

type Props = {
  visible: boolean;
  onCancel: () => void; // stay in quiz
  onConfirm: () => void; // exit quiz
};

export default function ExitQuizModal({ visible, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Exit Quiz?</Text>
          <Text style={styles.subtitle}>
            If you exit now, your progress will be lost.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.button, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelText}>Stay</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.button, styles.exitBtn]} onPress={onConfirm}>
              <Text style={styles.exitText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  cancelBtn: {
    backgroundColor: "#eee",
  },
  cancelText: {
    fontSize: 16,
    color: "#333",
  },
  exitBtn: {
    backgroundColor: "#d9534f",
  },
  exitText: {
    fontSize: 16,
    color: "white",
  },
});
