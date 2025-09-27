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
import { createPersonalizedQuizClient } from "../../gemini.client";
import LoadingModal from "../components/LoadingModal";

export default function InterestSelectionScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigation =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "InterestSelection">
    >();
  const route = useRoute<RouteProp<RootStackParamList, "InterestSelection">>();
  const { fullName, email } = route.params;

  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [progress, setProgress] = useState<
    { id: string; label: string; status: "pending" | "in-progress" | "success" | "failed" }[]
  >([]);

  const toggleInterest = (title: string) => {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    );
  };

  // Helper function to format quiz labels
  const formatQuizLabel = (gameMode: string, level: string, difficulty: string) => {
    const levelNames: Record<string, string> = {
      "A1": "Level 1",
      "A2": "Level 2", 
      "B1": "Level 1",
      "B2": "Level 2",
      "C1": "Level 1",
      "C2": "Level 2"
    };

    const difficultyNames: Record<string, string> = {
      "easy": "Easy",
      "medium": "Medium", 
      "hard": "Hard"
    };

    return `${gameMode} - ${difficultyNames[difficulty]} - ${levelNames[level]}`;
  };

  const handleCreateAccount = async () => {
    if (selected.length < 3) {
      Alert.alert("Selection Required", "Please select at least 3 interests.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage("Creating your account...");

      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("Error", "No authenticated user found.");
        setLoading(false);
        return;
      }

      const uid = user.uid;

      if (db.collection) {
        const firestore = db;
        const { serverTimestamp } = firestore.constructor;
        await firestore.collection("users").doc(uid).set(
          {
            name: fullName,
            email,
            interests: selected,
            createdAt: serverTimestamp?.() ?? new Date(),
          },
          { merge: true }
        );
      } else {
        const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
        await setDoc(
          doc(db, "users", uid),
          {
            name: fullName,
            email,
            interests: selected,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // Define the quiz plan to match the order in gemini.client
      const quizPlan = [
        { level: "A1", difficulty: "easy", gameMode: "Vocabulary" },
        { level: "A2", difficulty: "easy", gameMode: "Vocabulary" },
        { level: "B1", difficulty: "medium", gameMode: "Vocabulary" },
        { level: "B2", difficulty: "medium", gameMode: "Vocabulary" },
        { level: "C1", difficulty: "hard", gameMode: "Vocabulary" },
        { level: "C2", difficulty: "hard", gameMode: "Vocabulary" },
        { level: "A1", difficulty: "easy", gameMode: "Grammar" },
        { level: "A2", difficulty: "easy", gameMode: "Grammar" },
        { level: "B1", difficulty: "medium", gameMode: "Grammar" },
        { level: "B2", difficulty: "medium", gameMode: "Grammar" },
        { level: "C1", difficulty: "hard", gameMode: "Grammar" },
        { level: "C2", difficulty: "hard", gameMode: "Grammar" },
        { level: "A1", difficulty: "easy", gameMode: "Translation" },
        { level: "A2", difficulty: "easy", gameMode: "Translation" },
        { level: "B1", difficulty: "medium", gameMode: "Translation" },
        { level: "B2", difficulty: "medium", gameMode: "Translation" },
        { level: "C1", difficulty: "hard", gameMode: "Translation" },
        { level: "C2", difficulty: "hard", gameMode: "Translation" },
        { level: "A1", difficulty: "easy", gameMode: "Sentence Construction" },
        { level: "A2", difficulty: "easy", gameMode: "Sentence Construction" },
        { level: "B1", difficulty: "medium", gameMode: "Sentence Construction" },
        { level: "B2", difficulty: "medium", gameMode: "Sentence Construction" },
        { level: "C1", difficulty: "hard", gameMode: "Sentence Construction" },
        { level: "C2", difficulty: "hard", gameMode: "Sentence Construction" },
        { level: "A1", difficulty: "easy", gameMode: "Reading Comprehension" },
        { level: "A2", difficulty: "easy", gameMode: "Reading Comprehension" },
        { level: "B1", difficulty: "medium", gameMode: "Reading Comprehension" },
        { level: "B2", difficulty: "medium", gameMode: "Reading Comprehension" },
        { level: "C1", difficulty: "hard", gameMode: "Reading Comprehension" },
        { level: "C2", difficulty: "hard", gameMode: "Reading Comprehension" },
      ];

      // Initialize progress with detailed labels
      setProgress(
        quizPlan.map((quiz, idx) => ({
          id: `${quiz.gameMode}-${quiz.level}`,
          label: formatQuizLabel(quiz.gameMode, quiz.level, quiz.difficulty),
          status: "pending" as const,
        }))
      );

      const { generateAllQuizzes } = await import("../../gemini.client");
      
      const allQuizzes = await generateAllQuizzes(
        uid,
        selected,
        (completed, total) => {
          setLoadingMessage(`We're crafting your personalized learning journey. Generated ${completed}/${total} quizzes...`);
          
          setProgress(prev => 
            prev.map((p, idx) => ({
              ...p,
              status: idx < completed ? "success" : idx === completed ? "in-progress" : "pending"
            }))
          );
        }
      );

      setLoadingMessage("Saving quizzes to database...");
      
      const savePromises = allQuizzes.map(async ({ quizId, questions, metadata }) => {
        if (db.collection) {
          const firestore = db;
          const { serverTimestamp } = firestore.constructor;
          await firestore.collection("quizzes").doc(quizId).set({
            quizId,
            userId: uid,
            level: metadata.level,
            gameMode: metadata.gameMode,
            difficulty: metadata.difficulty,
            questions,
            createdAt: serverTimestamp?.() ?? new Date(),
          });
        } else {
          const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
          await setDoc(doc(db, "quizzes", quizId), {
            quizId,
            userId: uid,
            level: metadata.level,
            gameMode: metadata.gameMode,
            difficulty: metadata.difficulty,
            questions,
            createdAt: serverTimestamp(),
          });
        }
      });

      await Promise.all(savePromises);

      setLoading(false);
      Alert.alert("Welcome!", "Your account and all 30 quizzes have been created successfully.");
      navigation.reset({
        index: 0,
        routes: [{ name: "WordOfTheDay" }],
      });
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      setLoading(false);
      Alert.alert("Error", err.message || "Something went wrong creating your quizzes.");
    }
  };

  return (
    <>
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

      <LoadingModal visible={loading} message={loadingMessage} progress={progress} />
    </>
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