// firebaseConfig.ts
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

let auth: any = null;
let db: any = null;
let app: any = null;
let googleConfigured = false;

/**
 * Initializes Firebase depending on environment:
 * - Expo Go → Firebase Web SDK
 * - Native build (EAS Dev/Prod) → React Native Firebase
 */
export async function initFirebase() {
  // Prevent re-initialization
  if (auth && db) return { auth, db, app };

  if (Constants.appOwnership === "expo") {
    // Expo Go → Firebase Web SDK
    console.log("Expo Go detected → using Firebase Web SDK");

    const { initializeApp } = await import("firebase/app");
    const { initializeAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    // Fix TypeScript warning for persistence
    const { getReactNativePersistence } = require("firebase/auth") as any;

    const firebaseConfig = {
      apiKey: "AIzaSyC7AMHG2pEDsqL91NyTWlisA8YEl3SBxCA",
      authDomain: "engliquest-788b6.firebaseapp.com",
      projectId: "engliquest-788b6",
      storageBucket: "engliquest-788b6.appspot.com",
      messagingSenderId: "1072058760841",
      appId: "1:1072058760841:web:664d901b651ba67d521058",
    };

    app = initializeApp(firebaseConfig);

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    db = getFirestore(app);
  } else {
    // Native builds → React Native Firebase
    console.log("Native build detected → using React Native Firebase");

    const authModule = (await import("@react-native-firebase/auth")).default;
    const firestoreModule = (await import("@react-native-firebase/firestore")).default;

    auth = authModule();
    db = firestoreModule();
    app = "native"; // placeholder

    // ⚡️ Do NOT configure Google here anymore; use configureGoogleSignin() instead
  }

  return { auth, db, app };
}

/**
 * Configures Google Sign-In for Native builds.
 * Must be called before calling GoogleSignin.signIn()
 */
export async function configureGoogleSignin() {
  if (googleConfigured || Constants.appOwnership === "expo") return;

  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

  GoogleSignin.configure({
    webClientId: "1072058760841-l2dfoc318glg28rlrubevsl0447alikd.apps.googleusercontent.com",
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });

  googleConfigured = true;
}

// Export accessors
export { auth, db, app };
