// src/screens/ProgressScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { initFirebase } from "firebaseConfig";
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type Badge = {
  id: string;
  title: string;
  subtitle?: string;
  image: number;
};

export const BADGES: Badge[] = [
  // --- Vocabulary ---
  {
    id: "vocab_easy",
    title: "Word Wanderer",
    subtitle: "Complete Vocabulary Easy",
    image: require("../../assets/Badges/Vocabulary 1.png"),
  },
  {
    id: "vocab_med",
    title: "Lexicon Learner",
    subtitle: "Complete Vocabulary Medium",
    image: require("../../assets/Badges/Vocabulary 2.png"),
  },
  {
    id: "vocab_hard",
    title: "Vocabulary Virtuoso",
    subtitle: "Complete Vocabulary Hard",
    image: require("../../assets/Badges/Vocabulary 3.png"),
  },
  {
    id: "vocab_champ",
    title: "Vocabulary Champion",
    subtitle: "Complete Vocab Hard",
    image: require("../../assets/Badges/Vocabulary 4.png"),
  },

  // --- Grammar ---
  {
    id: "grammar_easy",
    title: "Grammar Glider",
    subtitle: "Complete Grammar Easy",
    image: require("../../assets/Badges/Grammar 1.png"),
  },
  {
    id: "grammar_med",
    title: "Grammar Grinder",
    subtitle: "Complete Grammar Medium",
    image: require("../../assets/Badges/Grammar 2.png"),
  },
  {
    id: "grammar_hard",
    title: "Grammar Grandmaster",
    subtitle: "Complete Grammar Hard",
    image: require("../../assets/Badges/Grammar 3.png"),
  },
  {
    id: "grammar_champ",
    title: "Grammar Champion",
    subtitle: "Complete Grammar Hard",
    image: require("../../assets/Badges/Grammar 4.png"),
  },

  // --- Reading ---
  {
    id: "reading_easy",
    title: "Reading Rookie",
    subtitle: "Complete Reading Easy",
    image: require("../../assets/Badges/Reading 1.png"),
  },
  {
    id: "reading_med",
    title: "Reading Regular",
    subtitle: "Complete Reading Medium",
    image: require("../../assets/Badges/Reading 2.png"),
  },
  {
    id: "reading_hard",
    title: "Reading Royalty",
    subtitle: "Complete Reading Hard",
    image: require("../../assets/Badges/Reading 3.png"),
  },
  {
    id: "reading_champ",
    title: "Reading Champion",
    subtitle: "Complete Reading Hard",
    image: require("../../assets/Badges/Reading 4.png"),
  },

  // --- Sentence ---
  {
    id: "sentence_easy",
    title: "Sentence Starter",
    subtitle: "Complete Sentence Easy",
    image: require("../../assets/Badges/Sentence 1.png"),
  },
  {
    id: "sentence_med",
    title: "Sentence Spinner",
    subtitle: "Complete Sentence Medium",
    image: require("../../assets/Badges/Sentence 2.png"),
  },
  {
    id: "sentence_hard",
    title: "Syntax Specialist",
    subtitle: "Complete Sentence Hard",
    image: require("../../assets/Badges/Sentence 3.png"),
  },
  {
    id: "sentence_champ",
    title: "Sentence Champion",
    subtitle: "Complete Sentence Hard",
    image: require("../../assets/Badges/Sentence 4.png"),
  },

  // --- Translation ---
  {
    id: "trans_easy",
    title: "Translation Trainee",
    subtitle: "Complete Translation Easy",
    image: require("../../assets/Badges/Translation 1.png"),
  },
  {
    id: "trans_med",
    title: "Language Linker",
    subtitle: "Complete Translation Medium",
    image: require("../../assets/Badges/Translation 2.png"),
  },
  {
    id: "trans_hard",
    title: "Bilingual Boss",
    subtitle: "Complete Translation Hard",
    image: require("../../assets/Badges/Translation 3.png"),
  },
  {
    id: "trans_champ",
    title: "Translation Champion",
    subtitle: "Complete Translation Hard",
    image: require("../../assets/Badges/Translation 4.png"),
  },

  // --- Ultimate ---
  {
    id: "ultimate",
    title: "Ultimate Word Warrior",
    subtitle: "All 5 hard modes",
    image: require("../../assets/Badges/Ultimate Word Warrior.png"),
  },
];

export default function ProgressScreen() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Badge | null>(null);

  const { width } = Dimensions.get("window");
  const CARD_W = Math.floor((width - 16 * 2 - 12) / 2);

  // --- Load all progress categories ---
useEffect(() => {
  (async () => {
    try {
      const { auth, db } = await initFirebase();
      const user = auth.currentUser;
      if (!user) return;

      let badgeDoc: any = {};
      if (db.collection) {
        const snap = await db.collection("userbadges").doc(user.uid).get();
        badgeDoc = snap.exists ? snap.data() : {};
      } else {
        const { doc, getDoc } = await import("firebase/firestore");
        const snap = await getDoc(doc(db, "userbadges", user.uid));
        badgeDoc = snap.exists() ? snap.data() : {};
      }

      const unlockedSet = new Set(Object.keys(badgeDoc).filter((k) => badgeDoc[k]));

      // --- Ultimate Badge (if all 5 hard unlocked) ---
      const hardIds = [
        "vocab_hard",
        "grammar_hard",
        "reading_hard",
        "sentence_hard",
        "trans_hard",
      ];
      if (hardIds.every((id) => unlockedSet.has(id))) {
        unlockedSet.add("ultimate");
        if (db.collection) {
          await db.collection("userbadges").doc(user.uid).set({ ultimate: true }, { merge: true });
        } else {
          const { doc, setDoc } = await import("firebase/firestore");
          await setDoc(doc(db, "userbadges", user.uid), { ultimate: true }, { merge: true });
        }
      }

      setUnlocked(unlockedSet);
    } catch (err) {
      console.error("❌ Failed to load badges:", err);
    }
  })();
}, []);


  const progressPct = useMemo(
    () => Math.round((unlocked.size / BADGES.length) * 100),
    [unlocked.size]
  );

  const unlockedList = BADGES.filter((b) => unlocked.has(b.id));
  const lockedList = BADGES.filter((b) => !unlocked.has(b.id));

  const FAMILY_COLORS: Record<string, string> = {
    vocab: "#7C83FF",
    grammar: "#45C56B",
    sentence: "#D99A4A",
    trans: "#E06464",
    reading: "#6BA7D6",
    ultimate: "#9B59B6",
  };

  const familyOf = (id: string) =>
    id.split("_")[0] in FAMILY_COLORS ? id.split("_")[0] : "ultimate";

  const renderBadge =
    (lockedMode = false) =>
    ({ item }: { item: Badge }) => {
      const fam = familyOf(item.id);
      const borderColor = lockedMode ? "#e5e7eb" : FAMILY_COLORS[fam];

      return (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => setSelected(item)}
          style={[
            styles.badgeCard,
            { width: CARD_W, borderColor },
            lockedMode && styles.badgeCardLocked,
          ]}
        >
          <View style={styles.badgeRowTop}>
            <Image
              source={item.image}
              resizeMode="contain"
              style={[styles.badgeImg, lockedMode && { opacity: 0.25 }]}
            />
          </View>
          <View style={styles.badgeTextWrap}>
            <Text
              style={[styles.badgeTitle, lockedMode && { color: "#9AA1AC" }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            {!!item.subtitle && (
              <Text
                style={[
                  styles.badgeSubtitle,
                  lockedMode && { color: "#B8C0CB" },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            )}
          </View>
          {lockedMode && (
            <View style={styles.lockOverlay}>
              <Text style={styles.lockEmoji}>🔒</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#fff" }}>
        <View style={styles.headerNoBack}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* badge progress */}
        <View style={styles.section}>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressIcon}>🏅</Text>
              <Text style={styles.progressLabel}>Badge Progress</Text>
              <Text style={styles.progressPct}>{progressPct}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[styles.progressBarFill, { width: `${progressPct}%` }]}
              />
            </View>
          </View>
        </View>

        {/* unlocked */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>🔓</Text>
            <Text style={styles.sectionTitle}>Unlocked Badges</Text>
          </View>

          {unlockedList.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No badges unlocked yet.</Text>
            </View>
          ) : (
            <FlatList
              data={unlockedList}
              keyExtractor={(b) => b.id}
              renderItem={renderBadge(false)}
              numColumns={2}
              columnWrapperStyle={{ gap: 12 }}
              contentContainerStyle={{ gap: 12 }}
              scrollEnabled={false}
            />
          )}
        </View>

        {/* locked */}
        <View style={[styles.section, { paddingBottom: 28 }]}>
          <View style={styles.sectionHeaderDim}>
            <Text style={styles.sectionIconDim}>🔒</Text>
            <Text style={styles.sectionTitleDim}>Locked Badges</Text>
          </View>

          <FlatList
            data={lockedList}
            keyExtractor={(b) => b.id}
            renderItem={renderBadge(true)}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ gap: 12 }}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* modal */}
      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <View style={styles.modalCard}>
            {!!selected && (
              <>
                <Image
                  source={selected.image}
                  style={styles.modalImg}
                  resizeMode="contain"
                />
                <Text style={styles.modalTitle}>{selected.title}</Text>
                {!!selected.subtitle && (
                  <Text style={styles.modalSub}>{selected.subtitle}</Text>
                )}
                <Text style={styles.modalHint}>
                  {unlocked.has(selected.id)
                    ? "Unlocked! 🎉"
                    : "Locked. Finish the required level to unlock."}
                </Text>
                <Pressable
                  onPress={() => setSelected(null)}
                  style={styles.modalBtn}
                >
                  <Text style={styles.modalBtnText}>Close</Text>
                </Pressable>
              </>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// --- Styles (same as before) ---
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  headerNoBack: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111" },
  section: { paddingHorizontal: 16, marginTop: 8 },
  progressCard: {
    backgroundColor: "#F7F7FB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECECF4",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  progressIcon: { fontSize: 18, marginRight: 8 },
  progressLabel: {
    fontWeight: "700",
    color: "#1F2937",
    fontSize: 14,
    flex: 1,
  },
  progressPct: { fontWeight: "700", color: "#6B6EF9" },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressBarFill: { height: "100%", backgroundColor: "#6B6EF9" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
  },
  sectionIcon: { fontSize: 16, marginRight: 8 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  sectionHeaderDim: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginTop: 8,
    opacity: 0.75,
  },
  sectionIconDim: { fontSize: 16, marginRight: 8 },
  sectionTitleDim: { fontSize: 14, fontWeight: "700", color: "#6B7280" },
  emptyWrap: {
    borderWidth: 1,
    borderColor: "#ECECF4",
    borderRadius: 14,
    backgroundColor: "#FAFAFB",
    paddingVertical: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { color: "#6B7280", fontSize: 12, fontWeight: "600" },
  badgeCard: {
    borderWidth: 2,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 12,
    height: 138,
  },
  badgeCardLocked: { backgroundColor: "#FAFAFB" },
  badgeRowTop: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F6F7FB",
    justifyContent: "center",
    alignItems: "center",
  },
  badgeImg: { width: "80%", height: "80%" },
  badgeTextWrap: { marginTop: 8 },
  badgeTitle: { fontWeight: "700", color: "#111827", fontSize: 12 },
  badgeSubtitle: { color: "#6B7280", fontSize: 11, marginTop: 2 },
  lockOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  lockEmoji: { fontSize: 24, opacity: 0.7 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16 },
  modalImg: { width: 96, height: 96, alignSelf: "center" },
  modalTitle: {
    marginTop: 10,
    color: "#111827",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalSub: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 13,
    textAlign: "center",
  },
  modalHint: {
    marginTop: 10,
    color: "#374151",
    fontSize: 13,
    textAlign: "center",
  },
  modalBtn: {
    marginTop: 14,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#6B6EF9",
  },
  modalBtnText: { color: "white", fontWeight: "700" },
});
