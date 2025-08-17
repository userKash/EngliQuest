import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function BottomNav() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  const getColor = (screen: keyof RootStackParamList) =>
    route.name === screen ? '#5E67CC' : '#9CA3AF';

  const NavButton = ({
    screen,
    icon,
    label,
  }: {
    screen: 'Home' | 'Progress' | 'Profile'; // only these 3
    icon: keyof typeof Feather.glyphMap;
    label: string;
  }) => (
    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate(screen)}>
      <Feather name={icon} size={24} color={getColor(screen)} />
      <Text style={[styles.navText, { color: getColor(screen) }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.bottomNav}>
      <NavButton screen="Home" icon="home" label="Home" />
      <NavButton screen="Progress" icon="bar-chart-2" label="Progress" />
      <NavButton screen="Profile" icon="user" label="Profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 90,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 10, // space for text
  },
  navItem: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 2,
  },
});
