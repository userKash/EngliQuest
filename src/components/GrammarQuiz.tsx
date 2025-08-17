import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import PrimaryButton from './PrimaryButton';

type Question = {
  prompt: string;
  choices: string[];
  correctIndex: number;
};

type Props = {
  onFinish?: (finalScore: number, totalQuestions: number) => void;
  onProgressChange?: (p: { current: number; total: number }) => void;
};

export default function GrammarQuiz({ onFinish, onProgressChange }: Props) {
  const questions: Question[] = [
    {
      prompt: 'Fill in the blank: She ___ to school every day.',
      choices: ['goes', 'go', 'going', 'gone'],
      correctIndex: 0,
    },
    {
      prompt: 'Choose the grammatically correct sentence.',
      choices: [
        'He don’t like it.',
        'He doesn’t likes it.',
        'He doesn’t like it.',
        'He not like it.',
      ],
      correctIndex: 2,
    },
  ];

  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const last = qIndex === questions.length - 1;
  const choiceLabels = ['A', 'B', 'C', 'D'];
  const question = questions[qIndex];

  useEffect(() => {
    onProgressChange?.({ current: qIndex, total: questions.length });
  }, [qIndex]);

  const handleSelect = (i: number) => {
    setSelected(i);
    if (i === question.correctIndex) setScore((p) => p + 10);
  };

  const handleNext = () => {
    setSelected(null);
    if (!last) setQIndex((p) => p + 1);
    else {
      onFinish?.(score, questions.length);
      Alert.alert('Score', `${score}/${questions.length * 10}`);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.card}>
        <Text style={styles.prompt}>{question.prompt}</Text>

        {question.choices.map((choice, i) => {
          const correct = question.correctIndex === i;
          const isSelected = selected === i;
          let choiceStyle = styles.choice;

          if (selected !== null) {
            if (correct) choiceStyle = { ...choiceStyle, ...styles.correctChoice };
            else if (isSelected) choiceStyle = { ...choiceStyle, ...styles.wrongChoice };
          }

          return (
            <TouchableOpacity
              key={i}
              style={choiceStyle}
              onPress={() => handleSelect(i)}
              disabled={selected !== null}>
              <Text style={styles.choiceLabel}>{choiceLabels[i]}</Text>
              <Text style={styles.choiceText}>{choice}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {selected !== null && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            {selected === question.correctIndex ? '✅ Correct! +10 points' : '❌ Incorrect'}
          </Text>
          <PrimaryButton label={last ? 'Finish' : 'Next Question'} onPress={handleNext} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16, paddingBottom: 90 },
  card: {
    borderWidth: 0.8,
    borderColor: '#A2A2A2',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
  },
  prompt: {
    marginTop: 10,
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
  feedbackText: { textAlign: 'center', color: '#28a745', marginBottom: 10, fontWeight: 'bold' },
});
