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
      'Read the word and choose the correct definition or meaning.\n\n' +
      'Some questions may ask for synonyms or usage.\n\n' +
      'Only one choice is correct.',
    tip: ' Tip: Look for capital letters and punctuation clues!',
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
