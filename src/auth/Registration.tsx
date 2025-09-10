import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/type";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { initFirebase } from "../../firebaseConfig"; 
import Constants from "expo-constants";

export default function RegistrationForm() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, "Register">>();

  const isExpoGo = Constants.appOwnership === "expo";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleNext = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      const { auth } = await initFirebase();

      if (isExpoGo) {
        // ✅ Web/Expo Go flow
        const { createUserWithEmailAndPassword } = await import("firebase/auth");
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("✅ User created (Web):", userCredential.user);
      } else {
        // ✅ Native flow
        const userCredential = await auth.createUserWithEmailAndPassword(
          email,
          password
        );
        console.log("✅ User created (Native):", userCredential.user);
      }

      Alert.alert("Success", "Registration successful!");
      navigation.navigate("InterestSelection", { fullName, email, password });
    } catch (error: any) {
      console.error("❌ Registration error:", error);
      Alert.alert("Registration Failed", error.message || "Something went wrong.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.heading}>Registration Form</Text>
        <Text style={styles.subheading}>
          Create your account to start learning English!
        </Text>

        <View style={styles.subContainer}>
          <Text style={styles.sectionTitle}>Create Account</Text>

          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputWrapper}>
            <Feather name="user" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Email */}
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputWrapper}>
            <Feather name="mail" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="#9ca3af" />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              placeholderTextColor="#9ca3af"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Feather
                name={showConfirm ? "eye-off" : "eye"}
                size={18}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.createBtn} onPress={handleNext}>
          <Text style={styles.createText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 120 },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    textAlign: "center",
    color: "#4b5563",
    marginBottom: 12,
  },
  subContainer: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  label: { fontSize: 14, marginTop: 12, marginBottom: 4, color: "#374151" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingTop: 1,
    paddingBottom: 4,
    lineHeight: 22,
  },
  buttonWrapper: { position: "absolute", bottom: 34, left: 24, right: 24 },
  createBtn: {
    backgroundColor: "#5E67CC",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  createText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
