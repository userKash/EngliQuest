import React, { useEffect } from "react";
import { Text, TouchableOpacity, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
} from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";

const THEME = "#5E67CC";

export default function ShineReQuestButton({ canReQuest, onPress }: any) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (canReQuest) {
      progress.value = withRepeat(
        withTiming(1, { duration: 1600 }),
        -1,
        false
      );
    } else {
      progress.value = 0;
    }
  }, [canReQuest]);

  // ✨ Full-size shine animation
  const shineStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-200, 260]);

    return {
      transform: [{ translateX }],
      opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.85, 0]),
    };
  });

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        disabled={!canReQuest}
        onPress={onPress}
        style={[styles.btn, canReQuest ? styles.enabled : styles.disabled]}
      >
        {canReQuest && <Animated.View style={[styles.shine, shineStyle]} />}

        {canReQuest ? (
          <MaterialIcons name="replay" size={20} color="#fff" style={{ marginRight: 8 }} />
        ) : (
          <MaterialIcons name="lock" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
        )}

        <Text
          style={[
            styles.text,
            canReQuest ? styles.textEnabled : styles.textDisabled,
          ]}
        >
          Re-Quest
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },

  btn: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },

  enabled: {
    backgroundColor: THEME,
    borderColor: THEME,
  },

  disabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
  },

  text: {
    fontSize: 15,
    fontWeight: "600",
  },

  textEnabled: {
    color: "#fff",
  },

  textDisabled: {
    color: "#9ca3af",
  },

  shine: {
    position: "absolute",
    top: 0,
    left: -200,
    height: "100%",
    width: 250, 

    backgroundColor: "rgba(255,255,255,0.35)",
    transform: [{ rotate: "-20deg" }],
  },
});
