import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ReQuestConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  destructive = false,
  onCancel,
  onConfirm,
}: Props) {

  const scaleAnim = React.useRef(new Animated.Value(0.85)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Warning Icon */}
          <View style={styles.iconWrap}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning-outline" size={34} color="#5E67CC" />
            </View>
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Centered Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onCancel} style={styles.btn}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.btn, styles.confirmBtn]}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const THEME = "#5E67CC";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  container: {
    width: "100%",
    padding: 24,
    borderRadius: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  iconWrap: {
    alignItems: "center",
    marginBottom: 10,
  },

  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "#eef0ff",
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f1f1f",
    textAlign: "center",
    marginTop: 10,
  },

  message: {
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 10,
    marginBottom: 26,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 14, 
  },

  btn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 8,
  },

  cancelText: {
    fontSize: 15,
    color: "#6b7280",
  },

  confirmBtn: {
    backgroundColor: "#eef0ff",
  },

  confirmText: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME,
  },
});
