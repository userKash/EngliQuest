import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

type Props = {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  onForgotPassword?: () => void;
  message?: string;
};

export default function ErrorModal({
  visible,
  onClose,
  onRetry,
  onForgotPassword,
  message = "The email or password you entered is incorrect.",
}: Props) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>

          <Image
            source={require("../../assets/errorIcon.png")} 
            resizeMode="contain"
          />

          <Text style={styles.title}>Login Failed</Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.forgotButton}
              onPress={onForgotPassword || onClose}
            >
              <Text style={styles.forgotText}>Forgot Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry || onClose}
            >
              <Text style={styles.retryText}>Try Again</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    width: "80%",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    width: 48,
    height: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  forgotButton: {
    borderWidth: 1,
    borderColor: "#5E67CC",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  forgotText: {
    color: "#5E67CC",
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#5E67CC",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
  },
});
