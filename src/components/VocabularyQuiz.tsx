import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { QuizProgress } from './GrammarQuiz';

type Props = {
  levelId: string;
  onProgressChange?: (p: QuizProgress) => void;
  onExit?: () => void;
};

// mock vocab — replace with your data
const QUESTIONS = [
  { word: 'Abundant', choices: ['Scarce', 'Plentiful', 'Tiny'], answer: 1 },
  { word: 'Reluctant', choices: ['Unwilling', 'Excited', 'Certain'], answer: 0 },
  { word: 'Tranquil', choices: ['Noisy', 'Peaceful', 'Fast'], answer: 1 },
];

export default function VocabularyQuiz({ levelId, onProgressChange, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const total = QUESTIONS.length;

  useEffect(() => {
    onProgressChange?.({ current: index, total });
  }, [index, total, onProgressChange]);

  const q = QUESTIONS[index];

  const next = () => {
    if (index + 1 < total) setIndex(index + 1);
    else onExit?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Level: {levelId}</Text>
      <Text style={styles.word}>{q.word}</Text>
      {q.choices.map((c, i) => (
        <TouchableOpacity key={i} style={styles.choice} onPress={next}>
          <Text style={styles.choiceText}>{c}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  subtitle: { fontSize: 14, color: '#555' },
  word: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  choice: {
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  choiceText: { fontSize: 16 },
});
