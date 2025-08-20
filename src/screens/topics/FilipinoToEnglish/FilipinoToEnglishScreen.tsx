import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // to save progress
import { useNavigation } from '@react-navigation/native';

// Reusable list component + types
import LevelList, { LevelDef, ProgressState } from '../../../components/LevelList';

const STORAGE_KEY = 'filipinoToEnglishProgress'; // unique key for this topic
const PASSING = 70;

// Difficulty + sublevels (IDs unique to this topic)
const LEVELS: LevelDef[] = [
  {
    key: 'easy',
    order: 1,
    title: 'Easy',
    description: 'Basic translation',
    sublevels: [
      { id: 'trans-easy-1', title: 'Level 1' },
      { id: 'trans-easy-2', title: 'Level 2' },
    ],
  },
  {
    key: 'medium',
    order: 2,
    title: 'Medium',
    description: 'Intermediate translation',
    sublevels: [
      { id: 'trans-medium-1', title: 'Level 1' },
      { id: 'trans-medium-2', title: 'Level 2' },
    ],
  },
  {
    key: 'hard',
    order: 3,
    title: 'Hard',
    description: 'Advanced translation',
    sublevels: [
      { id: 'trans-hard-1', title: 'Level 1' },
      { id: 'trans-hard-2', title: 'Level 2' },
    ],
  },
];

// Start with an empty progress object for new users
function makeInitialProgress(): ProgressState {
  return {};
}

export default function FilipinoToEnglishScreen() {
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

  // When a sublevel is tapped, navigate to your Translation game/screen
  const onStartSubLevel = (subId: string) => {
    navigation.navigate('FilipinoToEnglishGame', { levelId: subId });
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
              Translate Filipino to clear, natural English. Pass each difficulty with {PASSING}% to
              unlock the next.
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              💡 Translation Tips
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Translate simple words first
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Practice with everyday sentences
            </Text>
            <Text style={{ fontSize: 13, color: '#555', marginBottom: 6 }}>
              • Check meanings using a dictionary
            </Text>
          </View>
        }
      />
    </View>
  );
}
