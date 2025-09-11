// src/components/LoadingModal.tsx
import React from "react";
import { Modal, View, Text, ActivityIndicator, StyleSheet } from "react-native";

// 🔹 Reusable loading modal component
export default function LoadingModal({ visible, message }: { visible: boolean; message?: string }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}} // Prevent Android back dismiss
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#5E67CC" />
          <Text style={styles.text}>{message || "Loading..."}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
