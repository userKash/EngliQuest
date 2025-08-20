import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import PrimaryButton from './PrimaryButton';
import ResultModal from '../components/ResultModal';

type Question = {
  prompt: string;
  choices: string[];
  correctIndex: number;
};

type Props = {
  onProgressChange?: (p: { current: number; total: number }) => void;
};

export default function ReadingQuiz({ onProgressChange }: Props) {
  const [step, setStep] = useState<'read' | 'questions'>('read');

  /** PASSAGE (step: read) */
  const passageTitle = 'The Little Garden';
  const passage =
    'Maria loves her little garden behind her house. Every morning, she waters the plants with a small watering can. She grows tomatoes, carrots, and beautiful flowers.\n\n' +
    'The tomatoes are red and round. Maria picks them when they are ripe and gives some to her neighbors. The carrots grow underground, and Maria has to pull them out carefully.\n\n' +
    'Her favorite flowers are the sunflowers. They are tall and yellow, and they always face the sun. Maria feels happy when she works in her garden because it makes her feel close to nature.\n\n' +
    'On weekends, Maria’s little brother helps her. Together, they plant new seeds and take care of the garden. Maria teaches him how to be gentle with the plants.';

  /** QUESTIONS */
  const questions: Question[] = [
    {
      prompt: 'What does Maria do every morning?',
      choices: [
        'She picks tomatoes',
        'She waters the plants',
        'She plants new seeds',
        'She talks to neighbors',
      ],
      correctIndex: 1,
    },
    {
      prompt: 'What vegetables does Maria grow?',
      choices: [
        'Tomatoes and potatoes',
        'Carrots and onions',
        'Tomatoes and carrots',
        'Lettuce and cucumbers',
      ],
      correctIndex: 2,
    },
  ];

  const choiceLabels = ['A', 'B', 'C', 'D'];
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    onProgressChange?.({ current: step === 'read' ? 0 : 1, total: questions.length });
  }, [step]);

  const scoreCount = useMemo(
    () => answers.filter((a, i) => a === questions[i].correctIndex).length,
    [answers]
  );

  const review = useMemo(
    () =>
      questions.map((q, i) => ({
        question: q.prompt,
        yourAnswer: answers[i] >= 0 ? q.choices[answers[i]] : '—',
        isCorrect: answers[i] === q.correctIndex,
        correctAnswer: q.choices[q.correctIndex],
      })),
    [answers]
  );

  const handleSelect = (qi: number, ci: number) => {
    if (submitted) return;
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qi] = ci;
      return copy;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setShowResult(true);
  };

  // --- STEP: READING ---
  if (step === 'read') {
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.passageCard}>
          <Text style={styles.sectionTitle}>{passageTitle}</Text>
          <Text style={styles.passageText}>{passage}</Text>
        </View>

        <PrimaryButton label="Continue to Questions" onPress={() => setStep('questions')} />
        <View style={{ height: 90 }} />
      </ScrollView>
    );
  }

  // --- STEP: QUESTIONS ---
  return (
    <>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.questionsWrapper}>
          {questions.map((q, qi) => (
            <View key={qi} style={styles.questionBlock}>
              <Text style={styles.questionNumber}>
                {qi + 1}. {q.prompt}
              </Text>

              {q.choices.map((c, ci) => {
                const selected = answers[qi] === ci;
                const correct = q.correctIndex === ci;
                const showCorrect = submitted && correct;
                const showWrong = submitted && selected && !correct;

                return (
                  <TouchableOpacity
                    key={ci}
                    style={[
                      styles.choice,
                      selected && !submitted && styles.choiceSelected,
                      showCorrect && styles.choiceCorrect,
                      showWrong && styles.choiceWrong,
                    ]}
                    onPress={() => handleSelect(qi, ci)}
                    disabled={submitted}>
                    <Text style={styles.choiceLabel}>{choiceLabels[ci]}</Text>
                    <Text style={styles.choiceText}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        <PrimaryButton label="Submit" onPress={handleSubmit} />
        <View style={{ height: 90 }} />
      </ScrollView>

      <ResultModal
        visible={showResult}
        title="✅ Submitted"
        score={scoreCount}
        total={questions.length}
        review={review}
        onContinue={() => setShowResult(false)}
        onRequestClose={() => setShowResult(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, padding: 16, paddingBottom: 90 },

  passageCard: {
    borderWidth: 0.8,
    borderColor: '#A2A2A2',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  passageText: { lineHeight: 20, fontSize: 14, color: '#333' },

  questionsWrapper: {
    borderWidth: 0.8,
    borderColor: '#A2A2A2',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
  },
  questionBlock: { marginBottom: 22 },
  questionNumber: { fontSize: 15, fontWeight: '700', marginBottom: 12, color: '#111' },

  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  choiceLabel: { fontWeight: 'bold', marginRight: 10, color: '#333' },
  choiceText: { fontSize: 14, flexShrink: 1, color: '#222' },

  choiceSelected: { borderColor: '#6B7AF7', backgroundColor: '#F3F5FF' },
  choiceCorrect: { borderColor: '#28a745', backgroundColor: '#dff6e5' },
  choiceWrong: { borderColor: '#dc3545', backgroundColor: '#fde2e2' },
});
