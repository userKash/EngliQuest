import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type';
import type { RouteProp } from '@react-navigation/native';

export default function InterestSelectionScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, 'InterestSelection'>>();
  const route = useRoute<RouteProp<RootStackParamList, 'InterestSelection'>>();
  const { fullName, email, password } = route.params;

  const toggleInterest = (title: string) => {
    setSelected((prev) =>
      prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]
    );
  };

  const handleCreateAccount = async () => {
    if (selected.length < 3) {
      Alert.alert('Selection Required', 'Please select at least 3 interests.');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, interests: selected }),
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'Account created successfully!');
        navigation.navigate('Login');
      } else {
        Alert.alert('Registration Failed', data.error || 'Something went wrong.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not connect to the server.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>What interests you?</Text>
        <Text style={styles.subtext}>
          Select at least 3 topics you enjoy. We'll create personalized stories and lessons just for
          you!
        </Text>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, selected.includes('Adventure Stories') && styles.cardSelected]}
            onPress={() => toggleInterest('Adventure Stories')}>
            <Feather name="compass" size={24} color="#FAA030" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Adventure Stories</Text>
            <Text style={styles.description}>Exciting journeys and quests</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, selected.includes('Friendship') && styles.cardSelected]}
            onPress={() => toggleInterest('Friendship')}>
            <Feather name="users" size={24} color="#F59E0B" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Friendship</Text>
            <Text style={styles.description}>Stories about bonds and relationships</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, selected.includes('Fantasy & Magic') && styles.cardSelected]}
            onPress={() => toggleInterest('Fantasy & Magic')}>
            <Feather name="star" size={24} color="#8B5CF6" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Fantasy & Magic</Text>
            <Text style={styles.description}>Spells and mythical creatures</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, selected.includes('Music & Arts') && styles.cardSelected]}
            onPress={() => toggleInterest('Music & Arts')}>
            <Feather name="music" size={24} color="#10B981" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Music & Arts</Text>
            <Text style={styles.description}>Creative expression and performance</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, selected.includes('Sports & Games') && styles.cardSelected]}
            onPress={() => toggleInterest('Sports & Games')}>
            <Feather name="activity" size={24} color="#3B82F6" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Sports & Games</Text>
            <Text style={styles.description}>Athletic activities and competition</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, selected.includes('Nature & Animals') && styles.cardSelected]}
            onPress={() => toggleInterest('Nature & Animals')}>
            <Feather name="globe" size={24} color="#22C55E" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Nature & Animals</Text>
            <Text style={styles.description}>Wildlife and environmental themes</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.card, selected.includes('Filipino Culture') && styles.cardSelected]}
            onPress={() => toggleInterest('Filipino Culture')}>
            <Feather name="flag" size={24} color="#EC4899" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Filipino Culture</Text>
            <Text style={styles.description}>Traditional stories and customs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.card, selected.includes('Family Values') && styles.cardSelected]}
            onPress={() => toggleInterest('Family Values')}>
            <Feather name="heart" size={24} color="#EF4444" style={{ marginBottom: 8 }} />
            <Text style={styles.title}>Family Values</Text>
            <Text style={styles.description}>Family bonds and traditions</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateAccount}>
          <Text style={styles.createText}>Create</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 20,
  },
  subtext: { fontSize: 14, textAlign: 'center', marginBottom: 20, color: '#555' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#5E67CC',
    backgroundColor: '#eef2ff',
  },
  title: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 6,
    textAlign: 'center',
  },
  description: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonWrapper: {
    position: 'absolute',
    bottom: 34,
    left: 24,
    right: 24,
  },
  createBtn: {
    backgroundColor: '#5E67CC',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  createText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
