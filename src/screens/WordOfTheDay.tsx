import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/type';
import { useNavigation } from '@react-navigation/native';
import { fetchWordOfTheDayFromGemini, type WordData } from "../../gemini";
import { initFirebase } from "../../firebaseConfig"; 

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'WordOfTheDay'>;

export default function WordOfTheDayScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWordOfTheDay = async () => {
      try {
        const { auth } = await initFirebase();
        const currentUser = auth.currentUser;
        const userId = currentUser?.uid ?? "guest"; 

        const data = await fetchWordOfTheDayFromGemini(userId);
        setWordData(data);
      } catch (error) {
        console.error('Error fetching word of the day:', error);
        setWordData({
          word: 'Serendipity',
          definition: 'The occurrence of events by chance in a happy or beneficial way.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWordOfTheDay();
  }, []);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/rafiki.png')}
        style={styles.image}
        resizeMode="contain"
      />

      {loading ? (
        <ActivityIndicator size="large" color="#5E67CC" />
      ) : (
        <>
          <Text style={styles.label}>Word of the day</Text>
          <Text style={styles.word}>{wordData?.word}</Text>
          <Text style={styles.definition}>{wordData?.definition}</Text>
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonText}>Proceed</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  image: {
    width: 250,
    height: 200,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#555',
    marginBottom: 70,
  },
  word: {
    fontSize: 26,
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginBottom: 50,
  },
  definition: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 120,
    paddingHorizontal: 10,
  },
  button: {
    backgroundColor: '#5E67CC',
    paddingVertical: 14,
    paddingHorizontal: 90,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
