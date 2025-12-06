import { initFirebase } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";

export async function deleteUserQuizData(userId: string) {
  console.log("Deleting all quiz data for user:", userId);

  const { db, app } = await initFirebase();
  const isNative = app === "native";

  try {
    if (!isNative) {
      const q1 = query(collection(db, "quizzes"), where("userId", "==", userId));
      const quizzesSnap = await getDocs(q1);

      for (const d of quizzesSnap.docs) {
        await deleteDoc(doc(db, "quizzes", d.id));
      }
      const q2 = query(collection(db, "scores"), where("userId", "==", userId));
      const scoresSnap = await getDocs(q2);

      for (const d of scoresSnap.docs) {
        await deleteDoc(doc(db, "scores", d.id));
      }
      await deleteDoc(doc(db, "userbadges", userId));
      await deleteDoc(doc(db, "quiz_generations", userId));
    }

    else {
      const quizzesSnap = await db
        .collection("quizzes")
        .where("userId", "==", userId)
        .get();

      quizzesSnap.forEach((docSnap: any) => {
        db.collection("quizzes").doc(docSnap.id).delete();
      });

      const scoresSnap = await db
        .collection("scores")
        .where("userId", "==", userId)
        .get();

      scoresSnap.forEach((docSnap: any) => {
        db.collection("scores").doc(docSnap.id).delete();
      });
      await db.collection("userbadges").doc(userId).delete();
      await db.collection("quiz_generations").doc(userId).delete();
    }

    console.log("All existing data deleted successfully!");
    return true;

  } catch (err) {
    console.error("Re-Quest error:", err);
    throw err;
  }
}
