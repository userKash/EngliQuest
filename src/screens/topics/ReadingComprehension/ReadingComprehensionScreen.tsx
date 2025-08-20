// src/screens/Reading/ReadingComprehensionScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // to save progress
import { useNavigation } from '@react-navigation/native';

// Reusable list component + types
import LevelList, { LevelDef, ProgressState } from '../../../components/LevelList'; // adjust path if needed

const STORAGE_KEY = 'readingProgress'; // unique key for this topic
const PASSING = 70;

// Difficulty + sublevels for Reading
const LEVELS: LevelDef[] = [
  {
    key: 'easy',
    order: 1,
    title: 'Easy',
    description: 'Basic comprehension',
    sublevels: [
      { id: 'read-easy-1', title: 'Level 1' },
      { id: 'read-easy-2', title: 'Level 2' },
    ],
  },
  {
    key: 'medium',
    order: 2,
    title: 'Medium',
    description: 'Intermediate comprehension',
    sublevels: [
      { id: 'read-medium-1', title: 'Level 1' },
      { id: 'read-medium-2', title: 'Level 2' },
    ],
  },
  {
    key: 'hard',
    order: 3,
    title: 'Hard',
    description: 'Advanced comprehension',
    sublevels: [
      { id: 'read-hard-1', title: 'Level 1' },
      { id: 'read-hard-2', title: 'Level 2' },
    ],
  },
];

// Start with an empty progress object for new users
function makeInitialProgress(): ProgressState {
  return {};
}

export default function ReadingComprehensionScreen() {
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

  // When a sublevel is tapped, navigate to your Reading game/screen
  const onStartSubLevel = (subId: string) => {
    navigation.navigate('ReadingGame', { levelId: subId });
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
              Read carefully and look for the main idea. Passing each difficulty with {PASSING}%
              unlocks the next.
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>💡 Reading Tips</Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Read slowly and carefully
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Highlight key ideas
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Summarize what you read in your own word
            </Text>
          </View>
        }
      />
    </View>
  );
}
