import React, { useLayoutEffect, useState } from 'react';
import { View, Text } from 'react-native';
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
      'Arrange the jumbled words to form a correct, natural‑sounding English sentence.\n\n' +
      'Tap the words in order. Tap a selected word to remove it.\n\n' +
      'Punctuation is handled for you — focus on correct word order.',
    tip: 'Find the subject and verb first, then place modifiers and time expressions.',
    titleIcon: require('../../../../assets/Sentence Construction.png'), // update if you have a different filename
    tipIcon: require('../../../../assets/flat-color-icons_idea.png'),
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
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
