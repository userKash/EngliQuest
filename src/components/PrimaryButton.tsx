import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.btn, disabled && { opacity: 0.6 }]}
      activeOpacity={0.8}>
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: '#1e90ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  text: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
