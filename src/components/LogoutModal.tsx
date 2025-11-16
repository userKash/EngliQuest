import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { useMusic } from "../context/MusicContext";

type Props = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function LogoutModal({ visible, onCancel, onConfirm }: Props) {
  const { stopAllMusic } = useMusic();

  const handleConfirm = () => {
    try {
      stopAllMusic();
    } catch (err) {
      console.error("Error stopping music during logout:", err);
    }

    try {
      onConfirm();
    } catch (err) {
      console.error("Error in onConfirm handler:", err);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Image
            source={require("../../assets/logoutIcon.png")}
            style={styles.image}
          />
          <Text style={styles.title}>Comeback Soon!</Text>
          <Text style={styles.subtitle}>Are you sure you want to logout?</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleConfirm}>
              <Text style={styles.logoutText}>Logout</Text>
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
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  image: { width: 120, height: 120, resizeMode: "contain", marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#555", textAlign: "center", marginBottom: 16 },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#5E67CC",
    paddingVertical: 12,
    borderRadius: 10,
    marginRight: 6,
    alignItems: "center",
  },
  cancelText: { color: "#5E67CC", fontWeight: "600" },
  logoutBtn: {
    flex: 1,
    backgroundColor: "#5E67CC",
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "600" },
});
