import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import InstructionCard from '../../../components/InstructionCard';
import ReadingQuiz from '../../../components/ReadingQuiz';

export default function ReadingGameScreen() {
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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Comprehension Quiz</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>Question 1 of {progress.total}</Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: 'Reading Comprehension' });
    }
  }, [step, progress, navigation]);

  const instructions = {
    title: 'Reading Comprehension',
    body:
      'Read the passage carefully. Then answer all questions on the next screen.\n\n' +
      'Tip: Skim for the main idea first, then scan for details that match each question.',
    tip: 'Look for keywords in the question and find them in the passage.',
    titleIcon: require('../../../../assets/Reading Comprehension.png'),
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
          nextLabel="Continue to Questions"
        />
      ) : (
        <ReadingQuiz onProgressChange={setProgress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
});
