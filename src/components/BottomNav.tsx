// src/components/BottomNav.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  currentRoute?: string; // e.g. "Home"
  onNavigate: (name: 'Home' | 'Progress' | 'Profile') => void;
};

const BAR_HEIGHT = 85; // ← change height here
const ACTIVE = '#5B6BEE';

export default function BottomNav({ currentRoute, onNavigate }: Props) {
  const HIDE = ['Login', 'Register', 'InterestSelection', 'WordOfTheDay'];
  if (!currentRoute || HIDE.includes(currentRoute)) return null;

  const Tab = (p: { name: 'Home' | 'Progress' | 'Profile'; label: string; icon: any }) => {
    const active = currentRoute === p.name;
    return (
      <TouchableOpacity style={styles.tab} onPress={() => onNavigate(p.name)}>
        <Feather
          name={p.icon}
          size={20}
          style={[styles.icon, active && { color: ACTIVE, opacity: 1 }]}
        />
        <Text style={[styles.label, active && { color: ACTIVE, opacity: 1, fontWeight: '600' }]}>
          {p.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Tab name="Home" label="Home" icon="home" />
        <Tab name="Progress" label="Progress" icon="bar-chart-2" />
        <Tab name="Profile" label="Profile" icon="user" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0, // pinned to bottom (no floating)
    zIndex: 1000,
  },
  bar: {
    height: BAR_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: 0,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  icon: { color: '#000', opacity: 0.8 },
  label: { marginTop: 4, fontSize: 13, color: '#000', opacity: 0.8 },
});
