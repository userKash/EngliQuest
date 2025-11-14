// firebaseConfig.ts

import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

let auth: any = null;
let db: any = null;
let app: any = null;
let googleConfigured = false;

const firebaseEnvConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
};

export async function initFirebase() {
  if (auth && db && app) return { auth, db, app };

  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    console.log("Expo Go detected → using Firebase Web SDK");

    const { initializeApp } = await import("firebase/app");
    const { initializeAuth } = await import("firebase/auth");
    const { getFirestore } = await import("firebase/firestore");
    const { getReactNativePersistence } = require("firebase/auth") as any;

    app = initializeApp(firebaseEnvConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });

    db = getFirestore(app);
  } else {
    console.log("Native build detected → using React Native Firebase");

    const authModule = (await import("@react-native-firebase/auth")).default;
    const firestoreModule = (await import("@react-native-firebase/firestore")).default;

    auth = authModule();
    db = firestoreModule();
    app = "native";
  }

  return { auth, db, app };
}

export async function configureGoogleSignin() {
  const isExpoGo = Constants.appOwnership === "expo";
  if (googleConfigured || isExpoGo) return;
  const { GoogleSignin } = await import("@react-native-google-signin/google-signin");

  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    offlineAccess: true,
    forceCodeForRefreshToken: true,
  });

  googleConfigured = true;
}
export { auth, db, app };
