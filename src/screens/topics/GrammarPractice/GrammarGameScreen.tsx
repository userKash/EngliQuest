import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import InstructionCard from '../../../components/InstructionCard';
import GrammarQuiz from '../../../components/GrammarQuiz';

export default function GrammarGameScreen() {
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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Grammar Practice</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              Easy – Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else navigation.setOptions({ headerTitle: 'Grammar Practice' });
  }, [step, progress]);

  const instructions = {
    title: 'Grammar Practice',
    body:
      'Instruction:\n\n' +
      'Read each sentence and choose the grammatically correct option.\n\n' +
      'Focus on subject-verb agreement, verb tenses, and proper word order.\n\n' +
      'Only one choice is correct.',
    tip: 'Scan for the subject and the verb first before checking modifiers.',
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
        <GrammarQuiz onProgressChange={setProgress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#fff' } });
