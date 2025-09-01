import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/type";
import type { RouteProp } from "@react-navigation/native";
import { initFirebase } from "../../firebaseConfig";

export default function InterestSelectionScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "InterestSelection">
    >();
  const route = useRoute<RouteProp<RootStackParamList, "InterestSelection">>();
  const { fullName, email } = route.params;

  const toggleInterest = (title: string) => {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    );
  };

const handleCreateAccount = async () => {
  if (selected.length < 3) {
    Alert.alert("Selection Required", "Please select at least 3 interests.");
    return;
  }

  try {
    const { auth, db } = await initFirebase();
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No authenticated user found.");
      return;
    }

    if (db.collection) {
      await db.collection("users").doc(user.uid).set(
        {
          name: fullName,
          email,
          interests: selected,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } else {
      const { doc, setDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: fullName,
          email,
          interests: selected,
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    }

    Alert.alert("Welcome!", "Your account has been created successfully.");
    navigation.reset({
      index: 0,
      routes: [{ name: "WordOfTheDay" }],
    });
  } catch (err: any) {
    console.error("Firestore save error:", err);
    Alert.alert("Error", err.message || "Something went wrong.");
  }
};


  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>What interests you?</Text>
        <Text style={styles.subtext}>
          Select at least 3 topics you enjoy. We'll create personalized stories
          and lessons just for you!
        </Text>

        <View style={styles.row}>
          <InterestCard
            title="Adventure Stories"
            description="Exciting journeys and quests"
            icon="compass"
            color="#FAA030"
            selected={selected}
            toggle={toggleInterest}
          />
          <InterestCard
            title="Friendship"
            description="Stories about bonds and relationships"
            icon="users"
            color="#F59E0B"
            selected={selected}
            toggle={toggleInterest}
          />
        </View>

        <View style={styles.row}>
          <InterestCard
            title="Fantasy & Magic"
            description="Spells and mythical creatures"
            icon="star"
            color="#8B5CF6"
            selected={selected}
            toggle={toggleInterest}
          />
          <InterestCard
            title="Music & Arts"
            description="Creative expression and performance"
            icon="music"
            color="#10B981"
            selected={selected}
            toggle={toggleInterest}
          />
        </View>

        <View style={styles.row}>
          <InterestCard
            title="Sports & Games"
            description="Athletic activities and competition"
            icon="activity"
            color="#3B82F6"
            selected={selected}
            toggle={toggleInterest}
          />
          <InterestCard
            title="Nature & Animals"
            description="Wildlife and environmental themes"
            icon="globe"
            color="#22C55E"
            selected={selected}
            toggle={toggleInterest}
          />
        </View>

        <View style={styles.row}>
          <InterestCard
            title="Filipino Culture"
            description="Traditional stories and customs"
            icon="flag"
            color="#EC4899"
            selected={selected}
            toggle={toggleInterest}
          />
          <InterestCard
            title="Family Values"
            description="Family bonds and traditions"
            icon="heart"
            color="#EF4444"
            selected={selected}
            toggle={toggleInterest}
          />
        </View>
      </ScrollView>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateAccount}>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function InterestCard({
  title,
  description,
  icon,
  color,
  selected,
  toggle,
}: {
  title: string;
  description: string;
  icon: any;
  color: string;
  selected: string[];
  toggle: (title: string) => void;
}) {
  const isSelected = selected.includes(title);
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={() => toggle(title)}
    >
      <Feather name={icon} size={24} color={color} style={{ marginBottom: 8 }} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120, backgroundColor: "#fff" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    marginTop: 20,
  },
  subtext: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
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
  cardSelected: { borderColor: "#5E67CC", backgroundColor: "#eef2ff" },
  title: { fontWeight: "600", fontSize: 15, marginBottom: 6, textAlign: "center" },
  description: { fontSize: 12, color: "#666", textAlign: "center" },
  buttonWrapper: { position: "absolute", bottom: 34, left: 24, right: 24 },
  createBtn: {
    backgroundColor: "#5E67CC",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
