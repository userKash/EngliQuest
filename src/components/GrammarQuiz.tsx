import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from './PrimaryButton';
import ResultModal from '../components/ResultModal';

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
  const insets = useSafeAreaInsets();

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
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const last = qIndex === questions.length - 1;
  const choiceLabels = ['A', 'B', 'C', 'D'];
  const question = questions[qIndex];

  useEffect(() => {
    onProgressChange?.({ current: qIndex, total: questions.length });
  }, [qIndex]);

  const handleSelect = (i: number) => {
    if (selected !== null) return; // lock after first pick
    setSelected(i);

    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIndex] = i;
      return copy;
    });

    if (i === question.correctIndex) setScore((p) => p + 10);
  };

  const handleNext = () => {
    if (!last) {
      setQIndex((p) => p + 1);
      setSelected(null);
    } else {
      setShowResult(true);
      onFinish?.(score, questions.length);
    }
  };

  const review = useMemo(
    () =>
      questions.map((q, i) => {
        const your = answers[i];
        return {
          question: q.prompt,
          yourAnswer: your >= 0 ? q.choices[your] : '—',
          isCorrect: your === q.correctIndex,
          correctAnswer: q.choices[q.correctIndex],
        };
      }),
    [answers]
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled">
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
          <View
            style={[
              styles.feedbackContainer,
              selected === question.correctIndex ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}>
            <Text
              style={[
                styles.feedbackText,
                selected === question.correctIndex
                  ? styles.feedbackTextCorrect
                  : styles.feedbackTextWrong,
              ]}>
              {selected === question.correctIndex ? '✅ Correct! +10 points' : '❌ Incorrect'}
            </Text>
          </View>
        )}

        {/* spacer so content doesn't hide behind sticky button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky bottom button (same behavior/position as your Filipino→English quiz) */}
      {selected !== null && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 100 }]}>
          <PrimaryButton label={last ? 'Finish' : 'Next Question'} onPress={handleNext} />
        </View>
      )}

      <ResultModal
        visible={showResult}
        score={score / 10}
        total={questions.length}
        review={review}
        onContinue={() => setShowResult(false)}
        onRequestClose={() => setShowResult(false)}
        title="🎉 Great job!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16 },
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
    marginBottom: 28,
    fontWeight: 'bold',
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginBottom: 10,
    width: '100%',
    backgroundColor: '#fff',
  },
  choiceLabel: { fontWeight: 'bold', marginRight: 10, color: '#333' },
  choiceText: { fontSize: 14, flexShrink: 1 },

  // state styles after selection
  correctChoice: { backgroundColor: '#E9F8EE', borderColor: '#2EB872' },
  wrongChoice: { backgroundColor: '#FDECEC', borderColor: '#F26D6D' },

  // feedback chip/card
  feedbackContainer: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  feedbackCorrect: { backgroundColor: '#E9F8EE', borderColor: '#2EB872' },
  feedbackWrong: { backgroundColor: '#FDECEC', borderColor: '#F26D6D' },
  feedbackText: { textAlign: 'center', fontWeight: 'bold' },
  feedbackTextCorrect: { color: '#1F8F5F' },
  feedbackTextWrong: { color: '#C43D3D' },

  // sticky primary action (no white background so it doesn't look like a card)
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
  },
});
