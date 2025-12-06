import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type Props = {
  selected: string[];
  onChange: (list: string[]) => void;
  disabled?: boolean;
  showModal?: (title: string, message: string, type?: "info" | "success" | "error") => void;
};

const INTERESTS = [
  { title: "Adventure Stories", icon: "compass", description: "Exciting journeys and quests", color: "#FAA030" },
  { title: "Friendship", icon: "users", description: "Stories about friendships", color: "#F59E0B" },
  { title: "Fantasy & Magic", icon: "star", description: "Spells and mythical creatures", color: "#8B5CF6" },
  { title: "Music & Arts", icon: "music", description: "Creative performance", color: "#10B981" },
  { title: "Sports & Games", icon: "activity", description: "Athletic activities", color: "#3B82F6" },
  { title: "Nature & Animals", icon: "globe", description: "Wildlife themes", color: "#22C55E" },
  { title: "Filipino Culture", icon: "flag", description: "Traditional stories", color: "#EC4899" },
  { title: "Family Values", icon: "heart", description: "Family stories", color: "#EF4444" },
];

export default function InterestPicker({
  selected,
  onChange,
  disabled = false,
  showModal,
}: Props) {
  const showModalLocal = (title: string, message: string, type: "info" | "success" | "error" = "info") => {
    if (typeof showModal === "function") {
      showModal(title, message, type);
    } else {
      Alert.alert(title, message, [{ text: "OK" }], { cancelable: true });
    }
  };

  const toggleInterest = (title: string) => {
    if (selected.includes(title)) {
      onChange(selected.filter((i) => i !== title));
    } else {
      if (selected.length < 3) {
        onChange([...selected, title]);
      } else {
        showModalLocal("Limit Reached", "You can only select up to 3 interests.", "info");
      }
    }
  };

  const rows = [];
  for (let i = 0; i < INTERESTS.length; i += 2) {
    rows.push(INTERESTS.slice(i, i + 2));
  }

  return (
    <>
      {rows.map((pair, i) => (
        <View key={i} style={styles.row}>
          {pair.map((int) => {
            const isSelected = selected.includes(int.title);

            return (
              <TouchableOpacity
                key={int.title}
                onPress={() => toggleInterest(int.title)}
                disabled={disabled}
                style={[
                  styles.card,
                  isSelected && styles.cardSelected,
                  disabled && styles.cardDisabled,
                ]}
              >
                <Feather
                  name={int.icon as any}
                  size={24}
                  color={disabled ? "#ccc" : int.color}
                  style={{ marginBottom: 8 }}
                />
                <Text style={[styles.title, disabled && styles.textDisabled]}>
                  {int.title}
                </Text>
                <Text style={[styles.description, disabled && styles.textDisabled]}>
                  {int.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  cardSelected: {
    borderColor: "#5E67CC",
    backgroundColor: "#eef2ff",
  },
  cardDisabled: {
    opacity: 0.5,
  },
  title: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 6,
    textAlign: "center",
  },
  description: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  textDisabled: { color: "#999" },
});
