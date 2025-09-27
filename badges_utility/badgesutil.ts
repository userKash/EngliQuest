// badges_utility/badgesutil.ts
import { initFirebase } from "firebaseConfig";

export async function unlockBadge(
  category: "vocab" | "grammar" | "reading" | "sentence" | "trans",
  level: string,
  progress: Record<string, any>
): Promise<string[]> {
  const unlocked: string[] = [];

  try {
    const { auth, db } = await initFirebase();
    const user = auth.currentUser;
    if (!user) return [];

    const uid = user.uid;

    // --- Normalize level for per-level badge ---
    let raw = String(level || "").toLowerCase(); // e.g. "trans-easy-2" or "easy-2"

    if (category === "trans") {
      raw = raw.replace(/^trans-/, ""); // "trans-easy-2" → "easy-2"
    }

    const base = raw.replace(/-\d+$/, ""); // strip "-1", "-2"
    const normalizedLevel = base === "medium" ? "med" : base;

    const badgeId = `${category}_${normalizedLevel}`; // e.g. "grammar_easy"

    // Save per-level badge
    if (db.collection) {
      await db.collection("userbadges").doc(uid).set({ [badgeId]: true }, { merge: true });
    } else {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "userbadges", uid), { [badgeId]: true }, { merge: true });
    }
    console.log(`🏅 Badge unlocked: ${badgeId}`);
    unlocked.push(badgeId);

    // --- Champion Badge ---
    const requiredSublevels = [
      `${category}_easy-1`,
      `${category}_easy-2`,
      `${category}_medium-1`,
      `${category}_medium-2`,
      `${category}_hard-1`,
      `${category}_hard-2`,
    ];
    const allPerfect = requiredSublevels.every((sub) => progress[sub]?.score === 100);

    if (allPerfect) {
      const champId = `${category}_champ`;
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [champId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [champId]: true }, { merge: true });
      }
      console.log(`🏆 Champion badge unlocked: ${champId}`);
      unlocked.push(champId);
    }

    // --- Hard Badge (≥70% on hard-2) ---
    const hard2Key = `${category}_hard-2`;
    if (progress[hard2Key]?.score >= 70) {
      const hardId = `${category}_hard`;
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [hardId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [hardId]: true }, { merge: true });
      }
      console.log(`💪 Hard badge unlocked: ${hardId}`);
      unlocked.push(hardId);
    }

    // --- Ultimate Word Warrior ---
    const required = [
      "vocab_hard-2",
      "grammar_hard-2",
      "reading_hard-2",
      "sentence_hard-2",
      "trans_hard-2",
    ];
    const allHard2Passed = required.every((key) => progress[key]?.score >= 70);
    if (allHard2Passed) {
      const ultimateId = "ultimate_word_warrior";
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [ultimateId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [ultimateId]: true }, { merge: true });
      }
      console.log(`🔥 Ultimate Word Warrior unlocked: ${ultimateId}`);
      unlocked.push(ultimateId);
    }
  } catch (err) {
    console.error("❌ Error unlocking badge:", err);
  }

  return unlocked;
}
