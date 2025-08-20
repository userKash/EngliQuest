import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import PrimaryButton from './PrimaryButton';

type Props = {
  title: string;
  body: string;
  tip?: string;
  titleIcon?: ImageSourcePropType;
  tipIcon?: ImageSourcePropType;
  onNext: () => void;
  nextLabel?: string;
};

export default function InstructionCard({
  title,
  body,
  tip,
  titleIcon,
  tipIcon,
  onNext,
  nextLabel = 'Next',
}: Props) {
  return (
    <View style={styles.screen}>
      {/* Main card */}
      <View style={styles.card}>
        <View style={styles.rowCenter}>
          {titleIcon ? <Image source={titleIcon} style={styles.icon} /> : null}
          <Text style={styles.title}>{title}</Text>
        </View>

        <Text style={styles.body}>{body}</Text>

        {tip ? (
          <View style={[styles.rowCenter, { marginTop: 16 }]}>
            {tipIcon ? <Image source={tipIcon} style={styles.iconSmall} /> : null}
            <Text style={styles.tip}>{tip}</Text>
          </View>
        ) : null}
      </View>

      {/* Button pinned bottom */}
      <View style={styles.bottomButton}>
        <PrimaryButton label={nextLabel} onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  card: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: '#A2A2A2',
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center', // vertically centers
    alignItems: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: { width: 28, height: 28, marginRight: 8, resizeMode: 'contain' },
  iconSmall: { width: 18, height: 18, marginRight: 6, resizeMode: 'contain' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  body: {
    marginTop: 30,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  tip: { fontStyle: 'italic', color: '#666', textAlign: 'center', flexShrink: 1 },
  bottomButton: {
    marginTop: 'auto',
    marginBottom: 70,
  },
});
