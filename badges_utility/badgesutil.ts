//badge function natin cuh
import { initFirebase } from "firebaseConfig";

export async function unlockBadge(
  category: "vocab" | "grammar" | "reading" | "sentence" | "trans",
  level: string, 
  progress: Record<string, any>
): Promise<string[]> {
  const unlocked: string[] = [];

  try {
    console.log("🔑 unlockBadge called with:", { category, level, progress });

    const { auth, db } = await initFirebase();
    const user = auth.currentUser;
    if (!user) {
      console.log("⚠️ No user logged in, returning []");
      return [];
    }

    const uid = user.uid;

    // --- Normalize level ---
    let raw = String(level || "").toLowerCase(); 
    if (category === "trans") {
      raw = raw.replace(/^trans-/, "");
    }

    const base = raw.replace(/-\d+$/, "");
    const normalizedLevel = base === "medium" ? "med" : base;

    console.log("📚 Normalized values:", { raw, base, normalizedLevel });

    const progressKey = raw; 
    const score = progress[progressKey]?.score ?? 0;

    console.log("🎯 Progress lookup:", { progressKey, score });

    const badgeId = `${category}_${normalizedLevel}`; 

    if (/-2$/.test(raw) && score >= 70) {
      console.log(`✅ Unlocking badge ${badgeId} (score=${score})`);
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [badgeId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [badgeId]: true }, { merge: true });
      }
      unlocked.push(badgeId);
    } else {
      console.log(`⏭ Skipped badge ${badgeId} (raw=${raw}, score=${score})`);
    }

    // --- Champion Badge ---
    const requiredSublevels = [
      "easy-1",
      "easy-2",
      "med-1",
      "med-2",
      "hard-1",
      "hard-2",
    ];
    console.log("🏆 Checking champion badge, required:", requiredSublevels);

    const allPerfect = requiredSublevels.every((sub) => progress[sub]?.score === 100);
    console.log("🏆 Champion check:", { allPerfect });

    if (allPerfect) {
      const champId = `${category}_champ`;
      console.log(`✅ Unlocking Champion badge: ${champId}`);
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [champId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [champId]: true }, { merge: true });
      }
      unlocked.push(champId);
    }

    // --- Hard Badge (≥70% on hard-2) ---
    const hard2Key = "hard-2";
    const hardScore = progress[hard2Key]?.score ?? 0;
    console.log("💪 Checking Hard badge:", { hard2Key, hardScore });

    if (hardScore >= 70) {
      const hardId = `${category}_hard`;
      console.log(`✅ Unlocking Hard badge: ${hardId}`);
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [hardId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [hardId]: true }, { merge: true });
      }
      unlocked.push(hardId);
    }

    // para ma unlock this  Ultimate Word Warrior  we need to unlock this hard badges
    const required = [
      "vocab_hard-2",
      "grammar_hard-2",
      "reading_hard-2",
      "sentence_hard-2",
      "trans_hard-2",
    ];
    console.log("🔥 Checking Ultimate Word Warrior, required:", required);

    const allHard2Passed = required.every((key) => progress[key]?.score >= 70);
    console.log("🔥 Ultimate check:", { allHard2Passed });

    if (allHard2Passed) {
      const ultimateId = "ultimate_word_warrior";
      console.log(`✅ Unlocking Ultimate Word Warrior: ${ultimateId}`);
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [ultimateId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [ultimateId]: true }, { merge: true });
      }
      unlocked.push(ultimateId);
    }
  } catch (err) {
    console.error("❌ Error unlocking badge:", err);
  }

  console.log("📦 Returning unlocked badges:", unlocked);
  return unlocked;
}
