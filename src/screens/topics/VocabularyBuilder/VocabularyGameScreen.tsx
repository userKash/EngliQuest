import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import InstructionCard from '../../../components/InstructionCard';
import VocabularyQuiz from '../../../components/VocabularyQuiz';
import BottomNav from '../../../components/BottomNav';

export default function VocabularyGameScreen() {
  const navigation = useNavigation();
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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Vocabulary Builder</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              Easy – Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else navigation.setOptions({ headerTitle: 'Vocabulary Builder' });
  }, [step, progress]);

  const instructions = {
    title: 'Vocabulary Builder',
    body:
      'Instruction:\n\n' +
      'Read the word and choose the correct definition or meaning.\n\n' +
      'Some questions may ask for synonyms or example usage.\n\n' +
      'Only one choice is correct.',
    tip: 'Use context clues to find the best answer.',
    titleIcon: require('../../../../assets/Vocabulary Builder.png'),
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
        <VocabularyQuiz onProgressChange={setProgress} />
      )}
      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#fff' } });
