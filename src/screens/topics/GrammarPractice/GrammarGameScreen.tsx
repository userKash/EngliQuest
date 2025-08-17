import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import InstructionCard from '../../../components/InstructionCard';
import GrammarQuiz from '../../../components/GrammarQuiz';
import BottomNav from '../../../components/BottomNav';

import type { RootStackParamList } from '../../../navigation/type';

type Props = NativeStackScreenProps<RootStackParamList, 'GrammarGame'>;

export default function GrammarGameScreen({ route, navigation }: Props) {
  const { levelId } = route.params; // e.g., 'easy-1'

  const [step, setStep] = useState<'instructions' | 'quiz'>('instructions');
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 1,
  });

  useLayoutEffect(() => {
    if (step === 'quiz') {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Grammar Practice</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              {levelId} • Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: 'Grammar Practice' });
    }
  }, [step, progress, levelId, navigation]);

  const instructions = {
    title: 'Grammar Practice',
    body:
      'Instruction:\n\n' +
      'Read each sentence and select the correct grammar form.\n\n' +
      'Focus on subject-verb agreement, tense, and word order.\n\n' +
      'Only one choice is correct.',
    tip: 'Read the full sentence out loud to hear which choice sounds correct.',
    titleIcon: require('../../../../assets/Grammar Practice.png'),
    tipIcon: require('../../../../assets/flat-color-icons_idea.png'),
  };

  return (
    <SafeAreaView style={styles.screen}>
      {step === 'instructions' ? (
        <InstructionCard
          title={instructions.title}
          body={instructions.body}
          tip={instructions.tip}
          titleIcon={instructions.titleIcon}
          tipIcon={instructions.tipIcon}
          onNext={() => setStep('quiz')}
        />
      ) : (
        <GrammarQuiz
          levelId={levelId}
          onProgressChange={(p) => setProgress(p)}
          onExit={() => navigation.goBack()}
        />
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
});
