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
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc } from "firebase/firestore";

export default function InterestSelectionScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "InterestSelection">
    >();
  const route = useRoute<RouteProp<RootStackParamList, "InterestSelection">>();
  const { fullName, email, password } = route.params;

  const toggleInterest = (title: string) => {
    setSelected((prev) =>
      prev.includes(title)
        ? prev.filter((i) => i !== title)
        : [...prev, title]
    );
  };

  const handleCreateAccount = async () => {
    if (selected.length < 3) {
      Alert.alert(
        "Selection Required",
        "Please select at least 3 interests."
      );
      return;
    }

    try {
      // ✅ 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ 2. Update displayName in Auth profile
      await updateProfile(user, { displayName: fullName });

      // ✅ 3. Save user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        interests: selected,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("Login");
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Something went wrong.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>What interests you?</Text>
        <Text style={styles.subtext}>
          Select at least 3 topics you enjoy. We'll create personalized
          stories and lessons just for you!
        </Text>

        {/* Example interests */}
        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.card,
              selected.includes("Adventure Stories") &&
                styles.cardSelected,
            ]}
            onPress={() => toggleInterest("Adventure Stories")}
          >
            <Feather
              name="compass"
              size={24}
              color="#FAA030"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.title}>Adventure Stories</Text>
            <Text style={styles.description}>
              Exciting journeys and quests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.card,
              selected.includes("Friendship") && styles.cardSelected,
            ]}
            onPress={() => toggleInterest("Friendship")}
          >
            <Feather
              name="users"
              size={24}
              color="#F59E0B"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.title}>Friendship</Text>
            <Text style={styles.description}>
              Stories about bonds and relationships
            </Text>
          </TouchableOpacity>
        </View>

        {/* ... (keep rest of your cards the same) ... */}
      </ScrollView>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateAccount}>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#fff",
  },
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
  cardSelected: {
    borderColor: "#5E67CC",
    backgroundColor: "#eef2ff",
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
  buttonWrapper: {
    position: "absolute",
    bottom: 34,
    left: 24,
    right: 24,
  },
  createBtn: {
    backgroundColor: "#5E67CC",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
