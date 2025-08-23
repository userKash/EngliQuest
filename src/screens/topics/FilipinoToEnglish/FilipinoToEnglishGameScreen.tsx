import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import InstructionCard from '../../../components/InstructionCard';
import FilipinoToEnglishQuiz from '../../../components/FilipinoToEnglishQuiz';

export default function FilipinoToEnglishGameScreen() {
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
    } else navigation.setOptions({ headerTitle: 'Filipino to English' });
  }, [step, progress]);

  const instructions = {
    title: 'Filipino to English',
    body:
      'Instruction:\n\n' +
      'Read the Filipino word or short phrase.\n\n' +
      'Type its correct English translation.\n\n' +
      'Answers must be spelled correctly to be marked correct.',
    tip: 'Tip: Think of common English phrases. No need for full sentences!',
    titleIcon: require('../../../../assets/Filipino to English.png'),
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
        <FilipinoToEnglishQuiz onProgressChange={setProgress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#fff' } });
