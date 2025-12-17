import firestore from "@react-native-firebase/firestore";

export async function hasApprovedQuizForUser({
  interests,
  level,
}: {
  interests: string[];
  level: string;
}) {
    
  const checks = await Promise.all(
    interests.map(async (interest) => {
      const snap = await firestore()
        .collection("quiz_template_questions")
        .where("interest", "==", interest)
        .where("level", "==", level)
        .where("status", "==", "approved")
        .limit(1)
        .get();

      return !snap.empty;
    })
  );

  return checks.every(Boolean);
}
