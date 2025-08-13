import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../../../components/BottomNav';
import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';
type VocabQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number;
  sentence?: string;
};

export default function VocabularyGameScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<'instructions' | 'quiz'>('instructions');
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const instructions = {
    title: 'Vocabulary Builder',
    body:
      'Instruction: \n\n' +
      'Read the word and choose the correct definition or meaning.\n\n' +
      'Some questions may ask for synonyms or example usage.\n\n' +
      'Only one choice is correct.',
    tip: 'Use context clues to find the best answer.',
    titleIcon: require('../../../../assets/Vocabulary Builder.png'),
    tipIcon: require('../../../../assets/flat-color-icons_idea.png'),
  };

  const questions: VocabQuestion[] = [
    {
      sentence: 'word',
      prompt: 'Question',
      choices: ['Correct', 'option 2', 'option 3', 'option 4'],
      correctIndex: 0,
    },
    {
      sentence:
        'Even though the movie was three hours long, the audience was enthralled, sitting in complete silence and awe until the very end.',
      prompt: 'What does the word "enthralled" most likely mean?',
      choices: [
        'Bored and restless',
        'Fascinated and deeply interested',
        'Confused and uncertain',
        'Shocked and frightened',
      ],
      correctIndex: 1,
    },
  ];

  const choiceLabels = ['A', 'B', 'C', 'D'];
  const question = questions[qIndex];

  const handleSelect = (i: number) => {
    setSelected(i);
    if (i === question.correctIndex) {
      setScore((prev) => prev + 10);
    }
  };

  const handleNext = () => {
    setSelected(null);
    if (qIndex < questions.length - 1) {
      setQIndex((prev) => prev + 1);
    } else {
      alert(`Score: ${score}/${questions.length}`);
    }
  };

  useLayoutEffect(() => {
    if (step === 'quiz') {
      navigation.setOptions({
        headerTitle: () => (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Vocabulary Builder</Text>
            <Text style={{ fontSize: 12, color: '#555' }}>
              Easy – Question {qIndex + 1} of {questions.length}
            </Text>
          </View>
        ),
      });
    } else {
      navigation.setOptions({
        headerTitle: 'Vocabulary Builder',
      });
    }
  }, [qIndex, step]);
  return (
    <SafeAreaView style={styles.screen}>
      {step === 'instructions' ? (
        <View style={styles.wrapper}>
          {/* Card */}
          <View style={styles.card}>
            {/* Title with icon */}
            <View style={styles.rowCenter}>
              <Image source={instructions.titleIcon} style={styles.icon} />
              <Text style={styles.title}>{instructions.title}</Text>
            </View>

            <Text style={styles.body}>{instructions.body}</Text>

            {/* Tip with icon */}
            <View style={styles.rowCenter}>
              <Image source={instructions.tipIcon} style={styles.iconSmall} />
              <Text style={styles.tip}>{instructions.tip}</Text>
            </View>
          </View>

          {/* Button outside border */}
          <TouchableOpacity style={styles.button} onPress={() => setStep('quiz')}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* Question card */}
          <View style={styles.card}>
            {question.sentence && <Text style={styles.sentence}>{question.sentence}</Text>}
            <Text style={styles.prompt}>{question.prompt}</Text>

            {question.choices.map((choice, i) => {
              const correct = question.correctIndex === i;
              const isSelected = selected === i;

              let choiceStyle = styles.choice;
              let choiceTextStyle = styles.choiceText;

              if (selected !== null) {
                if (correct) {
                  choiceStyle = { ...choiceStyle, ...styles.correctChoice };
                } else if (isSelected) {
                  choiceStyle = { ...choiceStyle, ...styles.wrongChoice };
                }
              }

              return (
                <TouchableOpacity
                  key={i}
                  style={choiceStyle}
                  onPress={() => handleSelect(i)}
                  disabled={selected !== null}>
                  <Text style={styles.choiceLabel}>{choiceLabels[i]}</Text>
                  <Text style={choiceTextStyle}>{choice}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback */}
          {selected !== null && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>
                {selected === question.correctIndex ? `✅ Correct! +10 points` : '❌ Incorrect'}
              </Text>
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>
                  {qIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <BottomNav />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  wrapper: {
    flex: 1,
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 90,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 90,
  },
  card: {
    borderWidth: 0.8,
    borderColor: '#A2A2A2',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: 8,
    resizeMode: 'contain',
  },
  iconSmall: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  body: {
    marginTop: 30,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  tip: {
    marginTop: 30,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    flexShrink: 1,
  },
  button: {
    backgroundColor: '#5E5CE6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sentence: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  prompt: {
    marginTop: 30,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 45,
    fontWeight: 'bold',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 18,
    paddingHorizontal: 10,
    marginBottom: 10,
    width: '100%',
  },
  choiceLabel: { fontWeight: 'bold', marginRight: 10, color: '#333' },
  choiceText: { fontSize: 14, flexShrink: 1 },
  correctChoice: { backgroundColor: '#d4edda', borderColor: '#28a745' },
  wrongChoice: { backgroundColor: '#f8d7da', borderColor: '#dc3545' },
  feedbackContainer: {
    borderWidth: 1,
    borderColor: '#28a745',
    backgroundColor: '#eafbea',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  feedbackText: {
    textAlign: 'center',
    color: '#28a745',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  nextBtn: {
    backgroundColor: '#5E5CE6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextBtnText: { color: '#fff', fontWeight: 'bold' },
});
