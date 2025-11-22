import { useEffect } from "react";
import { initFirebase } from "../../firebaseConfig";
import GeneratingContentLoader from "../components/GeneratingContentLoader";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/type";

type LoadingScreenNav = NativeStackNavigationProp<
  RootStackParamList,
  "LoadingGeneration"
>;

type Props = {
  navigation: LoadingScreenNav;
};

export default function LoadingGenerationScreen({ navigation }: Props) {

  useEffect(() => {
    const interval = setInterval(async () => {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;

      if (!user) return;

      const uid = user.uid;
      const docRef = db.collection("quizzes").doc(uid);
      const snap = await docRef.get();

      if (snap.exists && snap.data().status === "completed") {
        clearInterval(interval);
        navigation.replace("WordOfTheDay");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [navigation]);

  return <GeneratingContentLoader />;
}
