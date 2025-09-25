// src/components/LoadingModal.tsx
import React from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";

interface QuizProgress {
  id: string;
  label: string; // e.g., "Grammar (A1)"
  status: "pending" | "success" | "failed" | "in-progress";
}

export default function LoadingModal({
  visible,
  message,
  progress,
}: {
  visible: boolean;
  message?: string;
  progress?: QuizProgress[];
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#5E67CC" />
          <Text style={styles.text}>{message || "Loading..."}</Text>

          {progress && (
            <FlatList
              data={progress}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.row}>
                  <Text style={styles.quizLabel}>{item.label}</Text>
                  {item.status === "success" && (
                    <Text style={styles.success}>✅</Text>
                  )}
                  {item.status === "failed" && (
                    <Text style={styles.failed}>❌</Text>
                  )}
                  {item.status === "in-progress" && (
                    <Text style={styles.inProgress}>⏳</Text>
                  )}
                  {item.status === "pending" && (
                    <Text style={styles.pending}>•</Text>
                  )}
                </View>
              )}
            />
          )}
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
    width: "80%",
    maxHeight: "70%",
  },
  text: {
    marginTop: 12,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  quizLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  success: { color: "green", fontSize: 18 },
  failed: { color: "red", fontSize: 18 },
  inProgress: { color: "#5E67CC", fontSize: 18 },
  pending: { color: "#aaa", fontSize: 18 },
});
