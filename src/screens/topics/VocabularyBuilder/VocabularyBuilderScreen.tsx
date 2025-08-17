import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // to save progress
import { useNavigation } from '@react-navigation/native';
import BottomNav from '../../../components/BottomNav';

// import the reusable component + types
import LevelList, { LevelDef, ProgressState } from '../../../components/LevelList'; // <-- adjust path if needed

const STORAGE_KEY = 'VocabularyProgress'; // key for storage
const PASSING = 70;

//  Difficulty and Sublevel definition (Grammar)
const LEVELS: LevelDef[] = [
  {
    key: 'easy',
    order: 1,
    title: 'Easy',
    description: 'Basic vocabulary',
    sublevels: [
      { id: 'easy-1', title: 'Level 1' },
      { id: 'easy-2', title: 'Level 2' },
    ],
  },
  {
    key: 'medium',
    order: 2,
    title: 'Medium',
    description: 'Intermediate vocabulary',
    sublevels: [
      { id: 'medium-1', title: 'Level 1' },
      { id: 'medium-2', title: 'Level 2' },
    ],
  },
  {
    key: 'hard',
    order: 3,
    title: 'Hard',
    description: 'Advanced vocabulary',
    sublevels: [
      { id: 'hard-1', title: 'Level 1' },
      { id: 'hard-2', title: 'Level 2' },
    ],
  },
];

// Start with an empty progress object for new users
function makeInitialProgress(): ProgressState {
  return {};
}

export default function GrammarPracticeScreen() {
  const navigation = useNavigation<any>();
  const [progress, setProgress] = useState<ProgressState>({}); // Track all progress

  // On first load, get saved progress from AsyncStorage.
  // If none is found, start with empty progress.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        setProgress(stored ? (JSON.parse(stored) as ProgressState) : makeInitialProgress());
      } catch {
        setProgress(makeInitialProgress());
      }
    })();
  }, []);

  // Starts the selected sublevel if it’s unlocked; otherwise, does nothing
  const onStartSubLevel = (subId: string) => {
    navigation.navigate('VocabularyGame', { levelId: subId });
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <LevelList
        levels={LEVELS}
        progress={progress}
        passing={PASSING}
        onStartSubLevel={onStartSubLevel}
        Footer={
          <View
            style={{
              marginTop: 20,
              backgroundColor: '#F6F4FF',
              borderRadius: 10,
              padding: 14,
              borderWidth: 1,
              borderColor: '#D0C4F7',
            }}>
            {/* Tips */}
            <Text style={{ fontSize: 13, marginBottom: 10, color: '#444' }}>
              Complete each level in order. Pass Easy, Medium, and Hard with {PASSING}% to unlock
              the next level.
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>💡 Learning Tips</Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Start with common words first
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Review words daily
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Use flashcards to remember new terms
            </Text>
          </View>
        }
      />
      <BottomNav />
    </View>
  );
}
