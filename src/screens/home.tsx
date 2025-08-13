import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type';
import BottomNav from '../components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [avatar, setAvatar] = useState<any>(require('../../assets/userProfile.png'));

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
    loadAvatar();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Image source={avatar} style={styles.avatar} />
          <View>
            <Text style={styles.greeting}>Hello, Sebastian</Text>
            <Text style={styles.subtext}>Let's play, learn, and have fun</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.welcome}>Welcome back to</Text>
          <Text style={styles.brand}>EngliQuest</Text>

          <View style={styles.progressCard}>
            <Text style={styles.cardTitle}>Overall Progress</Text>
            <Text style={styles.cardLabel}>Completion</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: '0%' }]} />
            </View>
            <Text style={styles.totalQuizzes}>Total Quizzes: 1</Text>
          </View>

          <Text style={styles.sectionTitle}>Recommended topics</Text>

          {/* Vocabulary Builder */}
          <View style={styles.topicCard}>
            <View style={styles.topicLeft}>
              <Image
                source={require('../../assets/Vocabulary Builder.png')}
                style={styles.topicIcon}
              />
              <View>
                <Text style={styles.topicTitle}>Vocabulary Builder</Text>
                <Text style={styles.topicDesc}>Learn new words with flashcards</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('VocabularyBuilder')}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>

          {/* Grammar Practice */}
          <View style={styles.topicCard}>
            <View style={styles.topicLeft}>
              <Image
                source={require('../../assets/Grammar Practice.png')}
                style={styles.topicIcon}
              />
              <View>
                <Text style={styles.topicTitle}>Grammar Practice</Text>
                <Text style={styles.topicDesc}>Master English grammar rules</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('GrammarPractice')}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>

          {/* Reading Comprehension */}
          <View style={styles.topicCard}>
            <View style={styles.topicLeft}>
              <Image
                source={require('../../assets/Reading Comprehension.png')}
                style={styles.topicIcon}
              />
              <View>
                <Text style={styles.topicTitle}>Reading Comprehension</Text>
                <Text style={styles.topicDesc}>Improve reading skills</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('ReadingComprehension')}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>

          {/* Filipino to English */}
          <View style={styles.topicCard}>
            <View style={styles.topicLeft}>
              <Image
                source={require('../../assets/Filipino to English.png')}
                style={styles.topicIcon}
              />
              <View>
                <Text style={styles.topicTitle}>Filipino to English</Text>
                <Text style={styles.topicDesc}>Practice translation skills</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('FilipinoToEnglish')}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>

          {/* Sentence Construction */}
          <View style={styles.topicCard}>
            <View style={styles.topicLeft}>
              <Image
                source={require('../../assets/Sentence Construction.png')}
                style={styles.topicIcon}
              />
              <View>
                <Text style={styles.topicTitle}>Sentence Construction</Text>
                <Text style={styles.topicDesc}>Arrange jumbled words</Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '0%' }]} />
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => navigation.navigate('SentenceConstruction')}>
              <Text style={styles.startText}>Start</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
      <BottomNav />
    </SafeAreaView>
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
  cardLabel: { fontSize: 12, color: '#666', marginBottom: 4 },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: { height: 6, backgroundColor: '#5E67CC' },
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
