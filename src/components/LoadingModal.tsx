import React from "react";
import {
  Modal,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";

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
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <Feather name="check-circle" size={16} color="#22C55E" />;
      case "in-progress":
        return <ActivityIndicator size="small" color="#5E67CC" />;
      case "failed":
        return <Feather name="x-circle" size={16} color="#EF4444" />;
      case "pending":
      default:
        return <ActivityIndicator size="small" color="#D1D5DB" />;
    }
  };

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
                  <View style={styles.iconContainer}>
                    {renderStatusIcon(item.status)}
                  </View>
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
    alignItems: "center",
    width: "100%",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  quizLabel: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});