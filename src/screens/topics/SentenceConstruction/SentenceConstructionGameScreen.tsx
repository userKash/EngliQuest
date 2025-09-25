import React, { useLayoutEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import InstructionCard from '../../../components/InstructionCard';
import SentenceConstructionQuiz from '../../../components/SentenceConstructionQuiz';

type ParamList = {
  SentenceConstructionGame: { levelId?: string };
};

export default function SentenceConstructionGameScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ParamList, 'SentenceConstructionGame'>>();
  const levelId = route.params?.levelId;

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
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Sentence Construction</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              {levelId ? `${levelId.replace('trans-', '').toUpperCase()} – ` : ''}
              Question {progress.current + 1} of {progress.total}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({ headerTitle: 'Sentence Construction' });
    }
  }, [step, progress, levelId, navigation]);

  const instructions = {
    title: 'Sentence Construction',
    body:
      'Instruction:\n\n' +
      'Arrange the given words to form a correct sentence.\n\n' +
      'Some questions may have cultural or grammatical hints.\n\n' +
      'Only one arrangement is correct.',
    tip: 'Tip: Look for capital letters and punctuation clues!',
    titleIcon: require('../../../../assets/Sentence Construction.png'),
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
        <SentenceConstructionQuiz levelId={levelId} onProgressChange={setProgress} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
});
