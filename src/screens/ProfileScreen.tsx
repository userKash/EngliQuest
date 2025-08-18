import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import BottomNav from '../components/BottomNav';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native'; // ✅ FIXED
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type'; 


const AVATARS = [
  require('../../assets/avatars/Ellipse1.png'),
  require('../../assets/avatars/Ellipse2.png'),
  require('../../assets/avatars/Ellipse3.png'),
  require('../../assets/avatars/Ellipse4.png'),
  require('../../assets/avatars/Ellipse5.png'),
  require('../../assets/avatars/Ellipse6.png'),
  require('../../assets/avatars/Ellipse7.png'),
  require('../../assets/avatars/Ellipse8.png'),
  require('../../assets/avatars/Ellipse9.png'),
  require('../../assets/avatars/Ellipse10.png'),
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export default function ProfileScreen() {
  const [selectedAvatar, setSelectedAvatar] = useState<any>(AVATARS[0]);
  const navigation = useNavigation<NavigationProp>();

  // ✅ Load avatar when screen is focused
  useFocusEffect(
    useCallback(() => {
      const loadAvatar = async () => {
        try {
          const saved = await AsyncStorage.getItem('selectedAvatar');
          if (saved) {
            setSelectedAvatar(JSON.parse(saved));
          }
        } catch (err) {
          console.error('Error loading avatar:', err);
        }
      };
      loadAvatar();
    }, [])
  );

  const handleAvatarSelect = async (avatar: any) => {
    setSelectedAvatar(avatar);
    try {
      await AsyncStorage.setItem('selectedAvatar', JSON.stringify(avatar));
    } catch (err) {
      console.error('Error saving avatar:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      Alert.alert('Logout', 'You have been logged out.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Logout failed.');
    }
  };


  const handleChangePassword = () => {
    Alert.alert('Change Password', 'Open change password flow (mock).');
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
        <View style={styles.headerNoBack}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.currentAvatarWrap}>
            <View style={styles.currentAvatarCircle}>
              <Image source={selectedAvatar} style={styles.avatarImage} />
            </View>
          </View>
          <Text style={styles.cardTitle}>Current Avatar</Text>
          <Text style={styles.cardHint}>Select a new avatar from the options below</Text>

          <View style={styles.avatarGrid}>
            {AVATARS.map((a, idx) => {
              const active = a === selectedAvatar;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleAvatarSelect(a)}
                  style={[styles.avatarItem, active && styles.avatarItemActive]}>
                  <Image source={a} style={styles.avatarImage} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.chipsRow}>
          <Chip icon={<Feather name="music" size={18} color="#3b82f6" />} label="Music" />
          <Chip
            icon={<Ionicons name="game-controller-outline" size={18} color="#16a34a" />}
            label="Games"
          />
          <Chip
            icon={<Ionicons name="sparkles-outline" size={18} color="#8b5cf6" />}
            label="Fantasy"
          />
        </View>

        <Text style={styles.sectionLabel}>Email</Text>
        <TextInput style={styles.inputReadOnly} value="klumabi@google.com" editable={false} />

        <Text style={styles.sectionLabel}>In-Game Name</Text>
        <TextInput style={styles.inputReadOnly} value="AstroBoy" editable={false} />

        <Text style={styles.sectionLabel}>Password Settings</Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleChangePassword}>
          <MaterialIcons name="lock-reset" size={20} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={styles.actionButtonText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionButton, styles.logout]} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#ef4444" style={{ marginRight: 10 }} />
          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 90 }} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <View style={styles.chip}>
      {icon}
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  headerNoBack: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  content: { paddingHorizontal: 16, paddingBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  currentAvatarWrap: { alignItems: 'center', marginTop: 4, marginBottom: 10 },
  currentAvatarCircle: {
    width: 110,
    height: 110,
    borderRadius: 9999,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardTitle: { textAlign: 'center', fontSize: 16, fontWeight: '700', color: '#111' },
  cardHint: { textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 2, marginBottom: 10 },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    justifyContent: 'center',
  },
  avatarItem: {
    width: '15%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarItemActive: { borderColor: '#8b5cf6', backgroundColor: '#f3e8ff' },
  chipsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    width: '31.5%',
    justifyContent: 'center',
  },
  chipText: { marginLeft: 8, fontSize: 13, color: '#111' },
  sectionLabel: { fontSize: 13, color: '#6b7280', marginTop: 18, marginBottom: 6, marginLeft: 2 },
  inputReadOnly: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 14,
    color: '#6b7280',
  },
  actionButton: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: { fontSize: 15, color: '#111', fontWeight: '600' },
  logout: { backgroundColor: '#fff7f7', borderColor: '#fde2e2' },
});
