import React from "react";
import { View, Text, Modal, TouchableOpacity, Switch, StyleSheet } from "react-native";

type SettingsModalProps = {
  visible: boolean;
  onClose: () => void;
  bgMusic: boolean;
  setBgMusic: (value: boolean) => void;
  soundEffects: boolean;
  setSoundEffects: (value: boolean) => void;
};

export default function SettingsModal({
  visible,
  onClose,
  bgMusic,
  setBgMusic,
  soundEffects,
  setSoundEffects,
}: SettingsModalProps) {
  return (
    <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Background Music</Text>
            <Switch
              value={bgMusic}
              onValueChange={setBgMusic}
              trackColor={{ false: "#ccc", true: "#5E67CC" }}
               thumbColor={bgMusic ? "#5E67CC" : "#5E67CC"}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingText}>Sound Effects</Text>
            <Switch
              value={soundEffects}
              onValueChange={setSoundEffects}
              trackColor={{ false: "#ccc", true: "#5E67CC" }}
               thumbColor={bgMusic ? "#5E67CC" : "#5E67CC"}
            />
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  settingText: {
    fontSize: 16,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#FF2A2A",
    borderRadius: 12,
    paddingVertical: 10,
  },
  closeText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
});
