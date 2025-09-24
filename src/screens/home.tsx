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

  // ✅ topic progress states
  const [vocabPct, setVocabPct] = useState(0);
  const [grammarPct, setGrammarPct] = useState(0);
  const [readingPct, setReadingPct] = useState(0);
  const [translationPct, setTranslationPct] = useState(0);
  const [sentencePct, setSentencePct] = useState(0);
  const [overallPct, setOverallPct] = useState(0);

  useEffect(() => {
    const loadAvatar = async () => {
      try {
        const saved = await AsyncStorage.getItem('selectedAvatar');
        if (saved) {
          setAvatar(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Error loading avatar:', err);
      }
    };

    const loadUser = async () => {
      try {
        const { auth, db } = await initFirebase();
        const user = auth.currentUser;
        if (!user) return;

        // ✅ get user profile
        if (db.collection) {
          const doc = await db.collection('users').doc(user.uid).get();
          if (doc.exists) {
            setUserName(doc.data().name || 'User');
          }
        } else {
          const { doc, getDoc } = await import('firebase/firestore');
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserName(userDoc.data().name || 'User');
          }
        }

        // ✅ get progress scores
        let snap;
        if (db.collection) {
          snap = await db.collection('scores').where('userId', '==', user.uid).get();
        } else {
          const { collection, query, where, getDocs } = await import('firebase/firestore');
          const q = query(collection(db, 'scores'), where('userId', '==', user.uid));
          snap = await getDocs(q);
        }

        let vocab = 0,
          grammar = 0,
          reading = 0,
          translation = 0,
          sentence = 0;
        let topicsAttempted = 0;

        snap.forEach((doc: any) => {
          const data = doc.data();
          const pct = data.score ?? 0;

          switch (data.quizType) {
            case 'Vocabulary':
              vocab = Math.max(vocab, pct);
              break;
            case 'Grammar':
              grammar = Math.max(grammar, pct);
              break;
            case 'Reading':
              reading = Math.max(reading, pct);
              break;
            case 'Translation':
              translation = Math.max(translation, pct);
              break;
            case 'Sentence':
              sentence = Math.max(sentence, pct);
              break;
          }
        });

        // count only attempted topics
        const scores = [vocab, grammar, reading, translation, sentence];
        topicsAttempted = scores.filter((s) => s > 0).length;

        setVocabPct(vocab);
        setGrammarPct(grammar);
        setReadingPct(reading);
        setTranslationPct(translation);
        setSentencePct(sentence);

        if (topicsAttempted > 0) {
          const overall = Math.round(scores.reduce((a, b) => a + b, 0) / topicsAttempted);
          setOverallPct(overall);
        }
      } catch (err) {
        console.error('Error fetching user/progress data:', err);
      }
    };

    loadAvatar();
    loadUser();
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

            <Text style={styles.totalQuizzes}>Total Quizzes: 5</Text>
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

// ✅ extracted component for topic card
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
  subtext: { fontSize: 12, color: '#888', fontFamily: 'PoppinsRegular' },
  welcome: {
    fontSize: 24,
    color: '#5E67CC',
    textAlign: 'center',
    fontFamily: 'PoppinsBoldItalic',
  },
  brand: {
    fontSize: 24,
    fontFamily: 'PoppinsBoldItalic',
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
