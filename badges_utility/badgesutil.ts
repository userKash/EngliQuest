// badges_utility/badgesutil.ts
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
    let raw = String(level || "").toLowerCase()
    const base = raw.replace(/-\d+$/, "");

    let normalizedLevel: string;
    if (category === "sentence") {
      normalizedLevel = base
        .replace(/^(sentence-|sc-)/, "")
        .replace(/^medium/, "med"); 
    } else {
      normalizedLevel = base
        .replace(/^(trans-|sentence-)/, "")
        .replace(/^medium/, "med");
    }


    console.log("Normalized values:", { raw, base, normalizedLevel });

    const score = progress[raw]?.score ?? 0;
    console.log("🎯 Progress lookup:", { raw, score });

    // ---------------- Champion Badge ----------------
    const requiredSublevels = [
      "easy-1",
      "easy-2",
      "med-1",
      "med-2",
      "hard-1",
      "hard-2",
    ];

    const allPerfect = requiredSublevels.every((sub) => {
      // Check with prefix if category uses it
      const key =
        category === "trans" || category === "sentence"
          ? `${category}-${sub}`
          : sub;
      return progress[key]?.score === 100;
    });

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

      return unlocked; // Champion overrides
    }

    // ---------------- Hard Badge ----------------
    if (/-hard-2$/.test(raw) || raw === "hard-2") {
      if (score >= 70) {
        const hardId = `${category}_hard`;
        console.log(`✅ Unlocking Hard badge: ${hardId}`);
        if (db.collection) {
          await db.collection("userbadges").doc(uid).set({ [hardId]: true }, { merge: true });
        } else {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "userbadges", uid), { [hardId]: true }, { merge: true });
        }
        unlocked.push(hardId);
        return unlocked; // skip normal if hard unlocked
      }
    }

    // ---------------- Normal Badge ----------------
    if (/-2$/.test(raw) && score >= 70) {
      const badgeId = `${category}_${normalizedLevel}`;
      console.log(`✅ Unlocking normal badge: ${badgeId}`);
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [badgeId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", uid), { [badgeId]: true }, { merge: true });
      }
      unlocked.push(badgeId);
    }

    // ---------------- Ultimate Badge ----------------
    const categories = ["vocab", "grammar", "reading", "sentence", "trans"];
    const allHard2Passed = categories.every((cat) => {
      const key = cat === "trans" || cat === "sentence" ? `${cat}-hard-2` : "hard-2";
      return progress[key]?.score >= 70;
    });

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