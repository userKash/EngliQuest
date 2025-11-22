import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
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

  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"info" | "success" | "error">("info");

  // Status check states
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"pending" | "completed" | null>(null);

  const showModal = (title: string, message: string, type: "info" | "success" | "error" = "info") => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  // Check generation status on mount
  useEffect(() => {
    checkGenerationStatus();
  }, []);

  const checkGenerationStatus = async () => {
    try {
      setCheckingStatus(true);
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      
      if (!user) return;

      const uid = user.uid;

      if (db.collection) {
        const firestore = db;
        const docSnapshot = await firestore.collection("quizzes").doc(uid).get();
        
        if (docSnapshot.exists) {
          const data = docSnapshot.data();
          setGenerationStatus(data.status);
        }
      } else {
        const { doc, getDoc } = await import("firebase/firestore");
        const docSnapshot = await getDoc(doc(db, "quizzes", uid));
        
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setGenerationStatus(data.status);
        }
      }
    } catch (error) {
      console.error("Error checking generation status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const toggleInterest = (title: string) => {
    setSelected((prev) => {
      if (prev.includes(title)) {
        return prev.filter((i) => i !== title);
      } else {
        if (prev.length < 3) {
          return [...prev, title];
        } else {
          showModal("Limit Reached", "You can only select up to 3 interests.", "info");
          return prev;
        }
      }
    });
  };

const handleCreateAccount = async () => {
  if (selected.length !== 3) {
    showModal("Selection Required", "Please select exactly 3 interests to continue.", "info");
    return;
  }

  try {
    setLoading(true);

    const { auth, db } = await initFirebase();
    const user = auth.currentUser;

    if (!user) {
      showModal("Error", "No authenticated user found. Please try logging in again.", "error");
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

      await firestore.collection("quizzes").doc(uid).set({
        userId: uid,
        interests: selected,
        status: "pending",
        createdAt: serverTimestamp?.() ?? new Date(),
        updatedAt: serverTimestamp?.() ?? new Date(),
      });

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
      await setDoc(doc(db, "quizzes", uid), {
        userId: uid,
        interests: selected,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setLoading(false);
    setGenerationStatus("pending");
    showModal(
      "Account Created!",
      "Your personalized learning content is being generated. Feel free to close the app and return later!",
      "success"
    );

    setTimeout(() => {
      setModalVisible(false);

      navigation.navigate("LoadingGeneration"); 

    }, 1500); 

  } catch (err: any) {
    console.error("Account creation error:", err);
    setLoading(false);
    showModal(
      "Error",
      err.message || "Something went wrong while creating your account. Please try again.",
      "error"
    );
  }
};


  const handleProceed = () => {
    if (generationStatus === "completed") {
      navigation.reset({
        index: 0,
        routes: [{ name: "WordOfTheDay" }],
      });
    }
  };

  return (
    <>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>What interests you?</Text>
          <Text style={styles.subtext}>
            Select exactly 3 topics you enjoy. We'll create personalized stories
            and lessons just for you!
          </Text>
          <Text style={styles.counter}>{selected.length}/3 selected</Text>

          {/* Generation Status Banner */}
          {generationStatus === "pending" && (
            <View style={styles.statusBanner}>
              <Feather name="clock" size={20} color="#F59E0B" />
              <View style={styles.statusTextContainer}>
                <Text style={styles.statusTitle}>Content Generation in Progress</Text>
                <Text style={styles.statusMessage}>
                  Your personalized quizzes are being created. This usually takes 5-10 minutes.
                  Check back soon!
                </Text>
              </View>
            </View>
          )}

          {generationStatus === "completed" && (
            <View style={[styles.statusBanner, styles.statusBannerSuccess]}>
              <Feather name="check-circle" size={20} color="#10B981" />
              <View style={styles.statusTextContainer}>
                <Text style={[styles.statusTitle, styles.statusTitleSuccess]}>
                  Your Content is Ready!
                </Text>
                <Text style={styles.statusMessage}>
                  All your personalized quizzes have been generated. Click below to get started!
                </Text>
              </View>
            </View>
          )}

          <View style={styles.row}>
            <InterestCard
              title="Adventure Stories"
              description="Exciting journeys and quests"
              icon="compass"
              color="#FAA030"
              selected={selected}
              toggle={toggleInterest}
              disabled={generationStatus !== null}
            />
            <InterestCard
              title="Friendship"
              description="Stories about bonds and relationships"
              icon="users"
              color="#F59E0B"
              selected={selected}
              toggle={toggleInterest}
              disabled={generationStatus !== null}
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
              disabled={generationStatus !== null}
            />
            <InterestCard
              title="Music & Arts"
              description="Creative expression and performance"
              icon="music"
              color="#10B981"
              selected={selected}
              toggle={toggleInterest}
              disabled={generationStatus !== null}
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
              disabled={generationStatus !== null}
            />
            <InterestCard
              title="Nature & Animals"
              description="Wildlife and environmental themes"
              icon="globe"
              color="#22C55E"
              selected={selected}
              toggle={toggleInterest}
              disabled={generationStatus !== null}
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
              disabled={generationStatus !== null}
            />
            <InterestCard
              title="Family Values"
              description="Family bonds and traditions"
              icon="heart"
              color="#EF4444"
              selected={selected}
              toggle={toggleInterest}
              disabled={generationStatus !== null}
            />
          </View>
        </ScrollView>

        <View style={styles.buttonWrapper}>
          {generationStatus === "completed" ? (
            <TouchableOpacity style={styles.createBtn} onPress={handleProceed}>
              <Text style={styles.createText}>Start Learning</Text>
            </TouchableOpacity>
          ) : generationStatus === "pending" ? (
            <TouchableOpacity 
              style={[styles.createBtn, styles.disabledBtn]} 
              onPress={() => showModal(
                "Content Generation in Progress",
                "Your personalized quizzes are still being created. This process typically takes 5-10 minutes. We'll notify you once everything is ready!",
                "info"
              )}
            >
              <Feather name="clock" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.createText}>Generation in Progress...</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.createBtn} 
              onPress={handleCreateAccount}
              disabled={loading}
            >
              <Text style={styles.createText}>
                {loading ? "Creating Account..." : "Create Account"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal */}
      <Modal transparent animationType="fade" visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={[
              styles.modalIconContainer,
              modalType === "success" && styles.modalIconSuccess,
              modalType === "error" && styles.modalIconError,
            ]}>
              <Feather 
                name={
                  modalType === "success" ? "check-circle" :
                  modalType === "error" ? "x-circle" : "info"
                } 
                size={32} 
                color="#fff" 
              />
            </View>
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  disabled 
}: any) {
  const isSelected = selected.includes(title);
  return (
    <TouchableOpacity
      style={[
        styles.card, 
        isSelected && styles.cardSelected,
        disabled && styles.cardDisabled
      ]}
      onPress={() => !disabled && toggle(title)}
      disabled={disabled}
    >
      <Feather 
        name={icon} 
        size={24} 
        color={disabled ? "#ccc" : color} 
        style={{ marginBottom: 8 }} 
      />
      <Text style={[styles.title, disabled && styles.textDisabled]}>{title}</Text>
      <Text style={[styles.description, disabled && styles.textDisabled]}>
        {description}
      </Text>
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
    marginBottom: 8,
    color: "#555",
  },
  counter: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
    color: "#5E67CC",
  },
  statusBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  statusBannerSuccess: {
    backgroundColor: "#D1FAE5",
    borderColor: "#A7F3D0",
  },
  statusTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 4,
  },
  statusTitleSuccess: {
    color: "#065F46",
  },
  statusMessage: {
    fontSize: 13,
    color: "#78350F",
    lineHeight: 18,
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
    backgroundColor: "#eef2ff" 
  },
  cardDisabled: {
    opacity: 0.5,
  },
  title: { 
    fontWeight: "600", 
    fontSize: 15, 
    marginBottom: 6, 
    textAlign: "center" 
  },
  description: { 
    fontSize: 12, 
    color: "#666", 
    textAlign: "center" 
  },
  textDisabled: {
    color: "#999",
  },
  buttonWrapper: { 
    position: "absolute", 
    bottom: 34, 
    left: 24, 
    right: 24 
  },
  createBtn: {
    backgroundColor: "#5E67CC",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  disabledBtn: {
    backgroundColor: "#9CA3AF",
  },
  createText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold" 
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  modalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#5E67CC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: "#10B981",
  },
  modalIconError: {
    backgroundColor: "#EF4444",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#5E67CC",
    borderRadius: 10,
    paddingHorizontal: 32,
    paddingVertical: 12,
    minWidth: 120,
  },
  modalButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
});