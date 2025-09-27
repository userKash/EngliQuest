// src/screens/HomeScreen.tsx
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { initFirebase } from '../../firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [avatar, setAvatar] = useState<any>(require('../../assets/userProfile.png'));
  const [userName, setUserName] = useState<string>('User');

  // topic progress states (one decimal accuracy)
  const [vocabPct, setVocabPct] = useState<number>(0);
  const [grammarPct, setGrammarPct] = useState<number>(0);
  const [readingPct, setReadingPct] = useState<number>(0);
  const [translationPct, setTranslationPct] = useState<number>(0);
  const [sentencePct, setSentencePct] = useState<number>(0);
  const [overallPct, setOverallPct] = useState<number>(0);

  // helper to compute overall progress exactly like your builders:
  function computeOverallProgress(progressData: Record<string, { score: number }>, sublevels: string[]) {
    const contribution = 100 / sublevels.length;
    const raw = sublevels.reduce((sum, id) => {
      const score = progressData[id]?.score ?? 0;
      return sum + (score / 100) * contribution;
    }, 0);
    // keep one decimal to match builder display like 95.5, 88.7, etc.
    return Math.round(raw * 10) / 10;
  }

  useEffect(() => {
    const loadUserAndProgress = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        // Avatar + username
        const savedAvatar = await AsyncStorage.getItem('selectedAvatar');
        if (savedAvatar) setAvatar(JSON.parse(savedAvatar));
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) setUserName(userDoc.data().name || 'User');

        // Keys used by your builder screens:
        const vocabKey = `VocabularyProgress_${user.uid}`;
        const grammarKey = `GrammarProgress_${user.uid}`;
        const readingKey = `ReadingProgress_${user.uid}`;
        const translationKey = `TranslationProgress_${user.uid}`;
        const sentenceKey = `SentenceConstructionProgress_${user.uid}`;

        // Load local progress objects (may be empty objects)
        const [vocabRaw, grammarRaw, readingRaw, translationRaw, sentenceRaw] = await Promise.all([
          AsyncStorage.getItem(vocabKey),
          AsyncStorage.getItem(grammarKey),
          AsyncStorage.getItem(readingKey),
          AsyncStorage.getItem(translationKey),
          AsyncStorage.getItem(sentenceKey),
        ]);

        const vocabProgress: Record<string, { score: number }> = vocabRaw ? JSON.parse(vocabRaw) : {};
        const grammarProgress: Record<string, { score: number }> = grammarRaw ? JSON.parse(grammarRaw) : {};
        const readingProgress: Record<string, { score: number }> = readingRaw ? JSON.parse(readingRaw) : {};
        const translationProgress: Record<string, { score: number }> = translationRaw ? JSON.parse(translationRaw) : {};
        const sentenceProgress: Record<string, { score: number }> = sentenceRaw ? JSON.parse(sentenceRaw) : {};

        // Fetch Firestore scores and merge into the local objects
        const snap = await db.collection('scores').where('userId', '==', user.uid).get();

        snap.forEach((doc: any) => {
          const data = doc.data() || {};
          const qtRaw = String(data.quizType ?? data.quiz_type ?? '').toLowerCase();
          const subId = String(data.levelId ?? data.difficulty ?? data.level ?? data.sublevel ?? '') || '';
          const score = Number(data.score ?? data.userscore ?? data.userscore ?? 0);

          if (!subId) return; // no level info -> skip

          // Decide which progress object to update based on quizType string
          if (qtRaw.includes('vocab') || qtRaw.includes('vocabulary')) {
            const prev = vocabProgress[subId]?.score ?? 0;
            if (score > prev) vocabProgress[subId] = { score };
          } else if (qtRaw.includes('grammar')) {
            const prev = grammarProgress[subId]?.score ?? 0;
            if (score > prev) grammarProgress[subId] = { score };
          } else if (qtRaw.includes('read')) {
            const prev = readingProgress[subId]?.score ?? 0;
            if (score > prev) readingProgress[subId] = { score };
          } else if (qtRaw.includes('trans') || qtRaw.includes('filipino') || qtRaw.includes('translation')) {
            const prev = translationProgress[subId]?.score ?? 0;
            if (score > prev) translationProgress[subId] = { score };
          } else if (qtRaw.includes('sentence') || qtRaw.includes('sentence construction')) {
            const prev = sentenceProgress[subId]?.score ?? 0;
            if (score > prev) sentenceProgress[subId] = { score };
          } else {
            // unknown quizType — try to infer by subId prefix
            if (subId.startsWith('trans-')) {
              // translation / sentence topics use trans- prefixes — we can't be sure which,
              // but leave them for the translators / sentence builders to pick up from their local store.
              // Prefer to put into translationProgress and sentenceProgress won't be overwritten here.
              const prev = translationProgress[subId]?.score ?? 0;
              if (score > prev) translationProgress[subId] = { score };
            } else {
              // else map into reading by default (safe fallback)
              const prev = readingProgress[subId]?.score ?? 0;
              if (score > prev) readingProgress[subId] = { score };
            }
          }
        });

        // Save the merged results back to AsyncStorage so builder screens will see them too
        await Promise.all([
          AsyncStorage.setItem(vocabKey, JSON.stringify(vocabProgress)),
          AsyncStorage.setItem(grammarKey, JSON.stringify(grammarProgress)),
          AsyncStorage.setItem(readingKey, JSON.stringify(readingProgress)),
          AsyncStorage.setItem(translationKey, JSON.stringify(translationProgress)),
          AsyncStorage.setItem(sentenceKey, JSON.stringify(sentenceProgress)),
        ]);

        // Sublevel arrays must match those used in each builder screen
        const baseSublevels = ['easy-1', 'easy-2', 'medium-1', 'medium-2', 'hard-1', 'hard-2'];
        const transSublevels = ['trans-easy-1','trans-easy-2','trans-medium-1','trans-medium-2','trans-hard-1','trans-hard-2'];

        const vocab = computeOverallProgress(vocabProgress, baseSublevels);
        const grammar = computeOverallProgress(grammarProgress, baseSublevels);
        const reading = computeOverallProgress(readingProgress, baseSublevels);
        const translation = computeOverallProgress(translationProgress, transSublevels);
        const sentence = computeOverallProgress(sentenceProgress, transSublevels);

        // overall = average of the five game modes (keep one decimal)
        const overall = Math.round(((vocab + grammar + reading + translation + sentence) / 5) * 10) / 10;

        // Set states
        setVocabPct(vocab);
        setGrammarPct(grammar);
        setReadingPct(reading);
        setTranslationPct(translation);
        setSentencePct(sentence);
        setOverallPct(overall);
      } catch (err) {
        console.error('Error loading user/progress:', err);
      }
    };

    loadUserAndProgress();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Hello, {userName}</Text>
            <Text style={styles.subtext}>Let's play, learn, and have fun</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.welcome}>Welcome back to</Text>
          <Text style={styles.brand}>EngliQuest</Text>

          <View style={styles.progressCard}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <Text style={styles.cardLabel}>Completion</Text>

            <View style={styles.progressRow}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${overallPct}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{overallPct}%</Text>
            </View>

            <Text style={styles.totalQuizzes}>Game Modes: 5</Text>
          </View>

          <Text style={styles.sectionTitle}>Recommended topics</Text>

          {/* Vocabulary Builder */}
          <TopicCard
            title="Vocabulary Builder"
            desc="Learn new words with flashcards"
            progress={vocabPct}
            icon={require('../../assets/Vocabulary Builder.png')}
            onPress={() => navigation.navigate('VocabularyBuilder')}
          />

          {/* Grammar Practice */}
          <TopicCard
            title="Grammar Practice"
            desc="Master English grammar rules"
            progress={grammarPct}
            icon={require('../../assets/Grammar Practice.png')}
            onPress={() => navigation.navigate('GrammarPractice')}
          />

          {/* Reading Comprehension */}
          <TopicCard
            title="Reading Comprehension"
            desc="Improve reading skills"
            progress={readingPct}
            icon={require('../../assets/Reading Comprehension.png')}
            onPress={() => navigation.navigate('ReadingComprehension')}
          />

          {/* Filipino to English */}
          <TopicCard
            title="Filipino to English"
            desc="Practice translation skills"
            progress={translationPct}
            icon={require('../../assets/Filipino to English.png')}
            onPress={() => navigation.navigate('FilipinoToEnglish')}
          />

          {/* Sentence Construction */}
          <TopicCard
            title="Sentence Construction"
            desc="Arrange jumbled words"
            progress={sentencePct}
            icon={require('../../assets/Sentence Construction.png')}
            onPress={() => navigation.navigate('SentenceConstruction')}
          />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// TopicCard component (unchanged)
function TopicCard({
  title,
  desc,
  progress,
  icon,
  onPress,
}: {
  title: string;
  desc: string;
  progress: number;
  icon: any;
  onPress: () => void;
}) {
  return (
    <View style={styles.topicCard}>
      <View style={styles.topicLeft}>
        <Image source={icon} style={styles.topicIcon} />
        <View style={{ flex: 1 }}>
          <Text style={styles.topicTitle}>{title}</Text>
          <Text style={styles.topicDesc}>{desc}</Text>

          <View style={styles.progressRow}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{progress}%</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.startBtn} onPress={onPress}>
        <Text style={styles.startText}>
          {progress >= 70 ? 'Review' : progress > 0 ? 'Continue' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 20, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  greeting: { fontSize: 14, color: '#333' },
  subtext: { fontSize: 12, color: '#888', fontFamily: 'PoppinsRegular' as any },
  welcome: {
    fontSize: 24,
    color: '#5E67CC',
    textAlign: 'center',
    fontFamily: 'PoppinsBoldItalic' as any,
  },
  brand: {
    fontSize: 24,
    fontFamily: 'PoppinsBoldItalic' as any,
    textAlign: 'center',
    color: '#5E67CC',
    marginBottom: 20,
  },
  progressCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#5E67CC',
  },
  progressPercent: {
    fontSize: 12,
    color: '#6B7280',
    minWidth: 34,
    textAlign: 'left',
    marginLeft: 2,
  },
  totalQuizzes: { fontSize: 10, color: '#999' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  topicCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  topicLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  topicIcon: { width: 28, height: 28, marginTop: 3 },
  topicTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  topicDesc: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  startBtn: {
    backgroundColor: '#5E67CC',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  startText: { color: '#fff', fontWeight: '600', fontSize: 12 },
});