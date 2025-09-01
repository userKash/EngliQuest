// firebaseConfig.ts
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

let auth: any = null;
let db: any = null;
let app: any = null;

/**
 * Initializes Firebase depending on environment:
 * - Expo Go → Firebase Web SDK
 * - Native build (EAS Dev/Prod) → React Native Firebase
 */
export async function initFirebase() {
  // ✅ Prevent re-initialization
  if (auth && db) {
    return { auth, db, app };
  }

  if (Constants.appOwnership === "expo") {
    // ✅ Expo Go → Firebase Web SDK
    console.log("Expo Go detected → using Firebase Web SDK");

    const { initializeApp } = await import("firebase/app");
    const { initializeAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");

    // ⚡️ Fix: cast to any so TS stops complaining
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
    // ✅ Native builds → React Native Firebase
    console.log("Native build detected → using React Native Firebase");

    const authModule = (await import("@react-native-firebase/auth")).default;
    const firestoreModule = (await import("@react-native-firebase/firestore")).default;

    auth = authModule(); // never null
    db = firestoreModule();
    app = "native"; // placeholder (so it's not null)

    // ✅ Configure Google Sign-In (must be Web client ID, not Android/iOS)
    GoogleSignin.configure({
      webClientId:
        "1072058760841-l2dfoc318glg28rlrubevsl0447alikd.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }

  return { auth, db, app };
}

// Export accessors
export { auth, db, app };
