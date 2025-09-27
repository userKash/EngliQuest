import React from 'react';
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from 'react-native';

type Props = {
  label: string;
  onPress?: (e: GestureResponderEvent) => void;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.btn, disabled && styles.btnDisabled]}>
      <Text style={[styles.txt, disabled && styles.txtDisabled]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 48,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5E67CC',
    marginTop: 30,
  },
  btnDisabled: {
    backgroundColor: '#A6A9D9',
  },
  txt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  txtDisabled: {
    color: '#eee',
  },
});
