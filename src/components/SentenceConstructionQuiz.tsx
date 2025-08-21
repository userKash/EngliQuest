import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from './PrimaryButton';

type Item = {
  id: string;
  prompt?: string;
  answer: string;
  points?: number;
  alsoAccept?: string[];
};

type Props = {
  onProgressChange?: (p: { current: number; total: number }) => void;
  levelId?: string;
};

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const normalize = (s: string) =>
  s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .toLowerCase();
const toTokens = (s: string) => normalize(s).split(' ');
const shuffle = <T,>(arr: T[]) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function SentenceConstructionQuiz({ onProgressChange, levelId }: Props) {
  const insets = useSafeAreaInsets();

  const bankEasy1: Item[] = [
    { id: 'e1-1', prompt: "Hint: Start with 'The'", answer: 'The cat is sleeping.' },
    { id: 'e1-2', prompt: "Hint: Start with 'The'", answer: 'The dog is playing.' },
    { id: 'e1-3', answer: 'She likes mangoes.' },
  ];
  const items: Item[] = useMemo(() => bankEasy1, [levelId]);

  const total = items.length;
  const [index, setIndex] = useState(0);
  const current = items[index];

  const [pool, setPool] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPool(shuffle(toTokens(current.answer)));
    setSelected([]);
    setLocked(false);
    setIsCorrect(null);
    onProgressChange?.({ current: index, total });
  }, [index]);

  const onPick = (tok: string, i: number) => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const next = [...pool];
    next.splice(i, 1);
    setPool(next);
    setSelected((s) => [...s, tok]);
  };

  const onUnpick = (i: number) => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextSel = [...selected];
    const [tok] = nextSel.splice(i, 1);
    setSelected(nextSel);
    setPool((p) => [...p, tok]);
  };

  const onReset = () => {
    if (locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelected([]);
    setPool(shuffle(toTokens(current.answer)));
  };

  const check = () => {
    if (locked || selected.length === 0) return;
    const guess = normalize(selected.join(' '));
    const correct = normalize(current.answer);
    const alts = (current.alsoAccept ?? []).map(normalize);
    const ok = guess === correct || alts.includes(guess);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsCorrect(ok);
    setLocked(true);
    if (ok) setScore((s) => s + (current.points ?? 12));
  };

  const next = () => {
    if (!locked) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (index < total - 1) setIndex((i) => i + 1);
    else console.log('Finished. Score:', score);
  };

  const actionLabel = locked ? (index < total - 1 ? 'Next Question' : 'Finish') : 'Check';
  const actionHandler = locked ? next : check;
  const actionDisabled = !locked && selected.length === 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Arrange the words</Text>
          <Text style={styles.cardBody}>
            Arrange the words below to form a correct sentence. Tap words to add them to your
            sentence.
          </Text>
          {!!current.prompt && (
            <Text style={styles.hintLine}>
              💡 <Text style={styles.hintLink}>{current.prompt}</Text>
            </Text>
          )}
        </View>

        {/* Your Sentence */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Sentence</Text>
          <View style={styles.dashedBox}>
            {selected.length === 0 ? (
              <Text style={styles.placeholder}>Tap words below to build your sentence</Text>
            ) : (
              <View style={styles.rowWrap}>
                {selected.map((tok, i) => (
                  <TouchableOpacity
                    key={`${tok}-${i}`}
                    onPress={() => onUnpick(i)}
                    style={styles.selChip}>
                    <Text style={styles.selChipText}>{tok}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Available Words + Reset (copied layout from FilipinoToEnglish: outer box + square reset) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Words</Text>

          <View style={styles.outerPoolBox}>
            <View style={[styles.rowWrap, { flex: 1 }]}>
              {pool.map((tok, i) => (
                <TouchableOpacity
                  key={`${tok}-${i}`}
                  onPress={() => onPick(tok, i)}
                  style={styles.poolChip}>
                  <Text style={styles.poolChipText}>{tok}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={onReset}
              disabled={locked}
              style={[styles.resetBtn, locked && { opacity: 0.5 }]}>
              <Text style={styles.resetText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Feedback */}
        <View style={{ minHeight: 84 }}>
          {isCorrect !== null && (
            <View style={[styles.feedback, isCorrect ? styles.okBox : styles.badBox]}>
              <Text style={[styles.feedbackTitle, isCorrect ? styles.okText : styles.badText]}>
                {isCorrect ? `✅ Correct: +${current.points ?? 12} points` : '❌ Incorrect'}
              </Text>
              {!isCorrect && (
                <Text style={styles.feedbackText}>
                  Correct order:{' '}
                  <Text style={{ fontWeight: '700' }}>{normalize(current.answer)}</Text>
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 70 }]}>
        <PrimaryButton label={actionLabel} onPress={actionHandler} disabled={actionDisabled} />
      </View>
    </View>
  );
}

const BORDER = '#E4E6EE';
const TEXT_DARK = '#0F1728';
const TEXT_MUTED = '#6B7280';

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16 },

  card: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', marginBottom: 6, color: TEXT_DARK },
  cardBody: { color: TEXT_MUTED, fontSize: 13, lineHeight: 18 },
  hintLine: { marginTop: 8, fontSize: 13, color: TEXT_MUTED },
  hintLink: { color: '#3B82F6', textDecorationLine: 'underline' },

  sectionTitle: { fontWeight: '800', marginBottom: 8, color: TEXT_DARK, fontSize: 15 },

  dashedBox: {
    minHeight: 56,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D4D7E2',
    borderRadius: 12,
    backgroundColor: '#FCFCFE',
    padding: 12,
    justifyContent: 'center',
  },
  placeholder: { color: '#A0A4AE' },

  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },

  selChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B9C2FF',
    backgroundColor: '#EEF0FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  selChipText: { fontWeight: '700', color: '#4E56C9' },

  poolChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  poolChipText: { fontWeight: '600', color: '#222' },

  outerPoolBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 12,
    padding: 8,
    marginTop: 6,
    paddingVertical: 16,
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

  feedback: { marginTop: 10, borderRadius: 12, padding: 14, borderWidth: 1 },
  okBox: { backgroundColor: '#E9F8EE', borderColor: '#2EB872' },
  badBox: { backgroundColor: '#FDECEC', borderColor: '#F26D6D' },
  feedbackTitle: { fontWeight: '800', marginBottom: 6 },
  okText: { color: '#1F8F5F' },
  badText: { color: '#C43D3D' },
  feedbackText: { color: TEXT_DARK },

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
    backgroundColor: 'transparent',
  },
});
