import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type QuizProgress = { current: number; total: number };

type Props = {
  levelId: string;
  onProgressChange?: (p: QuizProgress) => void;
  onExit?: () => void;
};

// mock questions — replace with your data
const QUESTIONS = [
  { prompt: 'She ___ to school every day.', choices: ['go', 'goes', 'going'], answer: 1 },
  { prompt: 'They ___ dinner now.', choices: ['eat', 'are eating', 'eats'], answer: 1 },
  { prompt: 'He ___ a book yesterday.', choices: ['reads', 'read', 'reading'], answer: 1 },
];

export default function GrammarQuiz({ levelId, onProgressChange, onExit }: Props) {
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
      <Text style={styles.prompt}>{q.prompt}</Text>

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
  prompt: { fontSize: 18, fontWeight: '600', marginVertical: 8 },
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
