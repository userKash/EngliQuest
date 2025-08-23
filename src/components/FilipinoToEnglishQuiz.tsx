import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  UIManager,
  LayoutAnimation,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from './PrimaryButton';
import ResultModal from './ResultModal'; // <--- make sure path is correct

type QA = {
  filipino: string;
  note?: string;
  accepts: string[];
  points?: number;
};

type ReviewItem = {
  question: string;
  yourAnswer: string;
  isCorrect: boolean;
  correctAnswer?: string;
};

type Props = {
  onProgressChange?: (p: { current: number; total: number }) => void;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function FilipinoToEnglishQuiz({ onProgressChange }: Props) {
  const insets = useSafeAreaInsets();

  const items: QA[] = [
    { filipino: 'Bahay', note: '(Malaki ang aming bahay.)', accepts: ['house', 'home'] },
    { filipino: 'Kaibigan', note: '(Mabait ang aking kaibigan.)', accepts: ['friend'] },
    { filipino: 'Araw', note: '(Mainit ang araw ngayon.)', accepts: ['sun', 'day'] },
    { filipino: 'Gabi', note: '(Tahimik ang gabi.)', accepts: ['night'] },
    { filipino: 'Paaralan', note: '(Maganda ang aming paaralan.)', accepts: ['school'] },
  ];

  const total = items.length;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0); // points (kept if you use points elsewhere)

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    onProgressChange?.({ current: index, total });
  }, [index, total, onProgressChange]);

  const current = items[index];
  const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ');

  const check = () => {
    if (!value.trim() || locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    const ok = current.accepts.some((a) => normalize(a) === normalize(value));
    setIsCorrect(ok);
    setLocked(true);
    if (ok) {
      setScore((s) => s + (current.points ?? 12));
      setCorrectCount((c) => c + 1);
    }

    // push review entry
    setReview((r) => [
      ...r,
      {
        question: current.filipino,
        yourAnswer: value.trim(),
        isCorrect: ok,
        correctAnswer: ok ? undefined : current.accepts[0],
      },
    ]);
  };

  const next = () => {
    if (!locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

    if (index < total - 1) {
      setIndex((i) => i + 1);
      setValue('');
      setLocked(false);
      setIsCorrect(null);
    } else {
      // FINISHED -> open modal
      setShowModal(true);
    }
  };

  const actionLabel = locked ? (index < total - 1 ? 'Next Question' : 'Finish') : 'Check';
  const actionHandler = locked ? next : check;
  const actionDisabled = locked ? false : value.trim().length === 0;

  const handleContinueFromModal = () => {
    // Close modal and reset for replay (customize as needed)
    setShowModal(false);
    setIndex(0);
    setValue('');
    setLocked(false);
    setIsCorrect(null);
    setScore(0);
    setCorrectCount(0);
    setReview([]);
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Header / progress */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Translate to English</Text>
            <Text style={styles.word}>{current.filipino}</Text>
            {!!current.note && <Text style={styles.note}>{current.note}</Text>}
          </View>

          {/* OUTER input border */}
          <View style={styles.outerInputBox}>
            <TextInput
              style={styles.input}
              value={value}
              onChangeText={(t) => {
                if (locked) return;
                setValue(t);
              }}
              placeholder="Type your answer here..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              editable={!locked}
              returnKeyType="done"
              onSubmitEditing={check}
            />

            {/* Reset button */}
            <TouchableOpacity
              onPress={() => {
                if (locked) return;
                setValue('');
              }}
              style={[styles.resetBtn, locked && { opacity: 0.5 }]}
              disabled={locked}>
              <Text style={styles.resetText}>↻</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback */}
          <View style={{ minHeight: 84 }}>
            {isCorrect !== null && (
              <View style={[styles.feedbackBox, isCorrect ? styles.correctBox : styles.wrongBox]}>
                <Text
                  style={[styles.feedbackTitle, isCorrect ? styles.correctText : styles.wrongText]}>
                  {isCorrect ? `✅ Correct: +${current.points ?? 12} points` : '❌ Incorrect'}
                </Text>

                {!isCorrect && (
                  <Text style={styles.feedbackDetail}>
                    Correct answer: <Text style={{ fontWeight: '700' }}>{current.accepts[0]}</Text>
                    {current.accepts.length > 1
                      ? ` (also: ${current.accepts.slice(1).join(', ')})`
                      : ''}
                  </Text>
                )}
              </View>
            )}
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Sticky button above bottom nav */}
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 70 }]}>
          <PrimaryButton label={actionLabel} onPress={actionHandler} disabled={actionDisabled} />
        </View>
      </KeyboardAvoidingView>

      {/* RESULT MODAL */}
      <ResultModal
        visible={showModal}
        score={correctCount}
        total={total}
        review={review}
        onContinue={handleContinueFromModal}
        onRequestClose={() => setShowModal(false)}
        title="🎉 Great job!"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },

  content: {
    padding: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  cardTitle: { fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  word: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    color: '#5E67CC',
    marginVertical: 30,
  },
  note: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
    marginVertical: 30,
  },

  outerInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    paddingVertical: 30,
  },

  input: {
    flex: 1,
    height: 45,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  resetBtn: {
    width: 40,
    height: 40,
    marginLeft: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: { fontSize: 16, fontWeight: '700', color: '#444' },

  /* Feedback */
  feedbackBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  correctBox: { backgroundColor: '#E9F8EE', borderColor: '#2EB872' },
  wrongBox: { backgroundColor: '#FDECEC', borderColor: '#F26D6D' },
  feedbackTitle: { fontWeight: '700', marginBottom: 6, textAlign: 'left' },
  correctText: { color: '#1F8F5F' },
  wrongText: { color: '#C43D3D' },
  feedbackDetail: { color: '#333' },

  /* Sticky bottom action */
  bottomBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
});
