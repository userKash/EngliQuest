// badges_utility/badgesutil.ts
import { initFirebase } from "firebaseConfig";

export async function unlockBadge(
  category: "vocab" | "grammar" | "reading" | "sentence" | "trans",
  level: string, // accept any string (we'll normalize inside)
  progress: Record<string, any>
): Promise<string[]> {
  const unlocked: string[] = [];

  try {
    const { auth, db } = await initFirebase();
    const user = auth.currentUser;
    if (!user) return [];

    const uid = user.uid;

    // Normalize incoming level:
    // - remove trailing "-<num>" (e.g. "medium-2" -> "medium")
    // - map "medium" -> "med" to match BADGES ids
    const raw = String(level || "").toLowerCase();
    const base = raw.replace(/-\d+$/, ""); // strip "-2", "-1", etc.
    const normalizedLevel = base === "medium" ? "med" : base; // e.g. "med", "easy", "hard"

    const badgeId = `${category}_${normalizedLevel}`; // matches BADGES (e.g. "vocab_med")

    // Save badge to Firestore (compat + modular safe)
    if (db.collection) {
      await db.collection("userbadges").doc(uid).set({ [badgeId]: true }, { merge: true });
    } else {
      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "userbadges", uid), { [badgeId]: true }, { merge: true });
    }

    console.log(`🏅 Badge unlocked: ${badgeId}`);
    unlocked.push(badgeId);

    // Helper to check attempted status in progress robustly:
    const attempted = (keyName: string) =>
      Object.entries(progress).some(([k, v]) => {
        const kBase = String(k).toLowerCase().replace(/-\d+$/, "");
        const kNorm = kBase === "medium" ? "med" : kBase;
        return kNorm === keyName && !!v?.attempted;
      });

    // Champion badge: user attempted easy + med + hard (regardless of "-2" suffix)
    if (attempted("easy") && attempted("med") && attempted("hard")) {
      const champId = `${category}_champ`;
      if (db.collection) {
        await db.collection("userbadges").doc(uid).set({ [champId]: true }, { merge: true });
      } else {
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "userbadges", user.uid), { [champId]: true }, { merge: true });
      }
      console.log(`🏆 Champion badge unlocked: ${champId}`);
      unlocked.push(champId);
    }
  } catch (err) {
    console.error("❌ Error unlocking badge:", err);
  }

  return unlocked;
}
