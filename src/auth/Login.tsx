import { useState, useEffect } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import Fontisto from "@expo/vector-icons/Fontisto";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/type";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { auth, initFirebase } from "../../firebaseConfig"; 
import Constants from "expo-constants";
import * as GoogleAuthSession from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

let GoogleSignin: any;
if (Constants.executionEnvironment !== "storeClient") {
  GoogleSignin =
    require("@react-native-google-signin/google-signin").GoogleSignin;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();
  const isExpoGo = Constants.appOwnership === "expo";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ✅ Web (Expo Go) flow
  const [request, response, promptAsync] =
    GoogleAuthSession.useIdTokenAuthRequest({
      webClientId:
        "1072058760841-l2dfoc318glg28rlrubevsl0447alikd.apps.googleusercontent.com",
      androidClientId:
        "1072058760841-m1etg934ctag3g9b3b5616tvadmbbp5t.apps.googleusercontent.com",
      iosClientId:
        "1072058760841-npc57ujq8omfm079qiomb2ls0ljmq7rn.apps.googleusercontent.com",
    });

  useEffect(() => {
    if (isExpoGo && response?.type === "success") {
      const { id_token } = response.params;
      if (!id_token) {
        Alert.alert("Google Sign-In Failed", "No ID token received.");
        return;
      }

      (async () => {
        const { auth } = await initFirebase();
        const { GoogleAuthProvider, signInWithCredential } = await import(
          "firebase/auth"
        );

        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential)
          .then((userCredential) => {
            console.log("✅ Google Sign-In (Expo Go):", userCredential.user);
            navigation.navigate("WordOfTheDay");
          })
          .catch((error) => {
            console.error("❌ Firebase Google Sign-In Error:", error);
            Alert.alert("Google Sign-In Failed", error.message);
          });
      })();
    }
  }, [response]);

// ✅ Native (APK / IPA) flow
const handleNativeGoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const { idToken } = await GoogleSignin.signIn();

    if (!idToken) {
      throw new Error("No ID token returned. Check Firebase SHA-1/256 config.");
    }

    // Import Firebase helpers dynamically (keeps compat with Expo Go + Native)
    const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");

    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Use your initialized Firebase auth instance
    const userCredential = await signInWithCredential(auth, googleCredential);

    console.log("✅ Google Sign-In (Native):", userCredential.user);
    navigation.navigate("WordOfTheDay");
  } catch (error) {
    let message = "An unknown error occurred";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    }
    console.error("❌ Native Google Sign-In Error:", error);
    Alert.alert("Google Sign-In Failed", message);
  }
};



  // ✅ Email/Password login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing Fields", "Please enter both email and password.");
      return;
    }
    try {
      const { auth } = await initFirebase();
      if (isExpoGo) {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
        console.log("✅ Email login (Web):", userCredential.user);
      } else {
        const userCredential = await auth.signInWithEmailAndPassword(
          email,
          password
        );
        console.log("✅ Email login (Native):", userCredential.user);
      }
      navigation.navigate("WordOfTheDay");
    } catch (error: any) {
      console.error("❌ Email/Password login error:", error);
      Alert.alert("Login Failed", error.message || "Something went wrong.");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} />
        <Text style={styles.title}>Sign in</Text>

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

        {/* Password */}
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

        {/* Google Sign-In button */}
        <TouchableOpacity
          style={styles.googleButton}
          disabled={isExpoGo ? !request : false}
          onPress={() =>
            isExpoGo ? promptAsync() : handleNativeGoogleLogin()
          }
        >
          <Image
            source={require("../../assets/googleIcon.png")}
            style={styles.googleIcon}
          />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Email/Password login button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        {/* ✅ Registration footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Sign up here</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, alignItems: "center" },
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  logo: { width: 200, height: 100, marginTop: 80, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  label: { color: "#374151", marginBottom: 4, alignSelf: "flex-start" },
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
  inputField: { flex: 1, fontSize: 16, color: "#111827", marginLeft: 10 },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    marginTop: 20,
  },
  googleIcon: { width: 20, height: 20, marginRight: 10 },
  googleButtonText: { color: "#111111" },
  button: {
    backgroundColor: "#5E67CC",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    width: "100%",
  },
  buttonText: { color: "#fff", textAlign: "center" },
  footerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: { color: "#1f2937", fontSize: 14 },
  linkText: { color: "#2563eb", fontSize: 16, fontWeight: "600" },
});
