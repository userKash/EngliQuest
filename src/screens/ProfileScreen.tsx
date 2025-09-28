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
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import { useFocusEffect, useNavigation } from '@react-navigation/native';
  import { signOut, onAuthStateChanged } from 'firebase/auth';
  import { initFirebase } from '../../firebaseConfig';
  import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
  import type { RootStackParamList } from '../navigation/type';
  import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
  import LogoutModal from '../components/LogoutModal';
  import ChangePasswordModal from '../components/ChangePasswordModal';

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
    const [email, setEmail] = useState<string>('');
    const [interests, setInterests] = useState<string[]>([]);
    const [logoutVisible, setLogoutVisible] = useState(false);
    const [changePassVisible, setChangePassVisible] = useState(false);

    const navigation = useNavigation<NavigationProp>();

    useFocusEffect(
      useCallback(() => {
        const loadProfileData = async () => {
          try {
            const saved = await AsyncStorage.getItem('selectedAvatar');
            if (saved) setSelectedAvatar(JSON.parse(saved));

            const { auth, db } = await initFirebase();

            const unsubscribe = onAuthStateChanged(auth, async (user) => {
              if (user?.email && user?.uid) {
                setEmail(user.email);
                console.log('🔑 Logged-in user UID:', user.uid);

                try {
                  // ✅ same API as HomeScreen
                  const userDoc = await db.collection('users').doc(user.uid).get();
                  if (userDoc.exists) {
                    const data = userDoc.data();
                    console.log('📂 Firestore user data:', data);

                    if (Array.isArray(data?.interests)) {
                      console.log('✅ Interests found:', data.interests);
                      setInterests(data.interests);
                    } else {
                      console.log('⚠️ No interests field or not an array.');
                    }
                  } else {
                    console.log('❌ No Firestore doc found for this user UID.');
                  }
                } catch (err) {
                  console.error('🔥 Error fetching Firestore user doc:', err);
                }
              } else {
                console.log('⚠️ No authenticated user found.');
              }
            });

            return unsubscribe;
          } catch (err) {
            console.error('Error loading profile:', err);
          }
        };
        loadProfileData();
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

    // Map interest keywords to icons
    const getInterestIcon = (interest: string) => {
      const lower = interest.toLowerCase();
      if (lower.includes('music')) return <Feather name="music" size={18} color="#3b82f6" />;
      if (lower.includes('game')) return <Ionicons name="game-controller-outline" size={18} color="#16a34a" />;
      if (lower.includes('fantasy') || lower.includes('magic')) return <Ionicons name="sparkles-outline" size={18} color="#8b5cf6" />;
      if (lower.includes('family')) return <Ionicons name="people-outline" size={18} color="#f97316" />;
      if (lower.includes('culture')) return <Ionicons name="earth-outline" size={18} color="#2563eb" />;
      return <Ionicons name="star-outline" size={18} color="#6b7280" />; // fallback
    };

    return (
      <View style={styles.screen}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
          <View style={styles.headerNoBack}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Avatar Card */}
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

          {/* Dynamic Chips */}
          {interests.length > 0 ? (
            <View style={styles.chipsRow}>
              {interests.map((interest, idx) => {
                console.log('🎨 Rendering chip for:', interest);
                return <Chip key={idx} icon={getInterestIcon(interest)} label={interest} />;
              })}
            </View>
          ) : (
            <Text style={{ marginTop: 12, color: '#9ca3af' }}>
              No interests selected yet.
            </Text>
          )}

          {/* Profile Info */}
          <Text style={styles.sectionLabel}>Email</Text>
          <TextInput style={styles.inputReadOnly} value={email} editable={false} />
          <Text style={styles.sectionLabel}>Password Settings</Text>
          <TouchableOpacity style={styles.actionButton} onPress={() => setChangePassVisible(true)}>
            <MaterialIcons name="lock-reset" size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.actionButton, styles.logout]}
            onPress={() => setLogoutVisible(true)}>
            <MaterialIcons name="logout" size={20} color="#ef4444" style={{ marginRight: 10 }} />
            <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 90 }} />
        </ScrollView>

        {/* Logout Modal */}
        <LogoutModal
          visible={logoutVisible}
          onCancel={() => setLogoutVisible(false)}
          onConfirm={async () => {
            try {
              const { auth } = await initFirebase();
              await signOut(auth);
              setLogoutVisible(false);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Logout failed.');
            }
          }}
        />

        <ChangePasswordModal
          visible={changePassVisible}
          onCancel={() => setChangePassVisible(false)}
          onConfirm={(current, newPass, confirmPass) => {
            if (!current || !newPass || !confirmPass) {
              Alert.alert('Error', 'Please fill in all fields.');
              return;
            }
            if (newPass !== confirmPass) {
              Alert.alert('Error', 'Passwords do not match.');
              return;
            }
            Alert.alert('Success', 'Password updated successfully (mock).');
            setChangePassVisible(false);
          }}
        />
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
  chipsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center',
    marginTop: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f5f3ff', 
    margin: 6,
  },
  chipText: { 
    marginLeft: 8, 
    fontSize: 13, 
    color: '#111', 
  },
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
