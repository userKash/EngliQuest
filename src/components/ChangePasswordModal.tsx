import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (current: string, newPass: string, confirmPass: string) => void;
};

export default function ChangePasswordModal({
  visible,
  onCancel,
  onConfirm,
}: Props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Password Settings</Text>

          {/* Current Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter current password"
              secureTextEntry={!showCurrent}
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowCurrent(!showCurrent)}
            >
              <Ionicons
                name={showCurrent ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* New Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Enter new password"
              secureTextEntry={!showNew}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowNew(!showNew)}
            >
              <Ionicons
                name={showNew ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              secureTextEntry={!showConfirm}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirm(!showConfirm)}
            >
              <Ionicons
                name={showConfirm ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.updateBtn}
              onPress={() =>
                onConfirm(currentPassword, newPassword, confirmPassword)
              }
            >
              <Text style={styles.updateText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },
  inputWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingRight: 40,
    backgroundColor: "#fafafa",
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 12,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    marginRight: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#a5b4fc",
    justifyContent: "center",
    alignItems: "center",
    height: 44,
  },
  cancelText: {
    color: "#6366f1",
    fontWeight: "600",
  },
  updateBtn: {
    flex: 1,
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    height: 44,
  },
  updateText: {
    color: "#fff",
    fontWeight: "600",
  },
});
