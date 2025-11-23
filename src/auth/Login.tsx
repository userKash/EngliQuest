import { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/type";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { auth, configureGoogleSignin, initFirebase } from "../../firebaseConfig";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import ErrorModal from "../components/ErrorModal";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";


WebBrowser.maybeCompleteAuthSession();

let GoogleSignin: any;
if (Constants.executionEnvironment !== "storeClient") {
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const { width } = Dimensions.get("window");
const scale = width / 375; 

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isExpoGo = Constants.appOwnership === "expo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

const handleLogin = async () => {
  if (!email || !password) {
    setErrorMessage("Please enter both email and password.");
    setErrorVisible(true);
    return;
  }

  try {
    const { auth } = await initFirebase();
    let userCredential;

    if (isExpoGo) {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      userCredential = await signInWithEmailAndPassword(auth, email, password);
    } else {
      userCredential = await auth.signInWithEmailAndPassword(email, password);
    }

    const user = userCredential.user;

    const approvedSnapshot = await firestore()
      .collection("quizzes")
      .where("userId", "==", user.uid)
      .where("status", "==", "approved")
      .get();

    const approvedCount = approvedSnapshot.size;

    if (approvedCount >= 30) {
      await AsyncStorage.setItem("GENERATION_STATUS", "completed");
      navigation.replace("CloudLoading");
    } else {
      await AsyncStorage.setItem("GENERATION_STATUS", "generating");
      navigation.replace("LoadingGeneration");
    }

  } catch (error: any) {
    setErrorMessage(getFirebaseErrorMessage(error));
    setErrorVisible(true);
  }
};



  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.inner}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} />
          <Text style={styles.title}>Welcome! Sign in to continue learning</Text>

          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrapper}>
            <Fontisto name="email" size={20} color="#A2A2A2" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Feather name="lock" size={18} color="gray" />
            <TextInput
              style={styles.inputField}
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {/*
          <TouchableOpacity
            style={styles.googleButton}
            disabled={isExpoGo ? !request : false}
            onPress={() => (isExpoGo ? promptAsync() : handleNativeGoogleLogin())}
          >
            <Image
              source={require("../../assets/googleIcon.png")}
              style={styles.googleIcon}
            />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity> 

          {/* Email login */}
          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Login</Text>
          </TouchableOpacity>  

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.linkText}>Sign up here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Error Modal */}
      <ErrorModal
        visible={errorVisible}
        onClose={() => setErrorVisible(false)}
        onRetry={() => setErrorVisible(false)} 
        onForgotPassword={() => {
          setErrorVisible(false);
          Alert.alert("Forgot Password", "Password reset feature coming soon!");
        }}
        message={errorMessage}
      />
    </SafeAreaView>
  );
}

function getFirebaseErrorMessage(error: any): string {
  switch (error.code) {
    case "auth/invalid-email":
      return "The email address is not valid.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/wrong-password":
      return "The password you entered is incorrect.";
    case "auth/invalid-credential":
      return "Your credentials are invalid or expired. Please try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  inner: {
    width: "100%",
    maxWidth: 400, 
    alignItems: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.14,
    resizeMode: "contain",
    marginTop: 40,
    marginBottom: 20,
  },
  title: {
    fontSize: Math.round(20 * scale),
    fontWeight: "500",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    color: "#374151",
    marginBottom: 4,
    alignSelf: "flex-start",
    fontSize: Math.round(14 * scale),
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    height: 50,
    width: "100%",
  },
  inputField: {
    flex: 1,
    fontSize: Math.round(16 * scale),
    color: "#111827",
    marginLeft: 10,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginTop: 20,
    width: "100%",
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { color: "#111111", fontSize: Math.round(14 * scale) },
  button: {
    backgroundColor: "#5E67CC",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: Math.round(16 * scale),
    fontWeight: "600",
  },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: { color: "#1f2937", fontSize: Math.round(14 * scale) },
  linkText: {
    color: "#2563eb",
    fontSize: Math.round(16 * scale),
    fontWeight: "600",
  },
});
