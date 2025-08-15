import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Text } from 'react-native';

import LoginScreen from './src/auth/Login';
import WordOfTheDayScreen from './src/screens/WordOfTheDay';
import HomeScreen from './src/screens/home';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegistrationForm from './src/auth/Registration';
import InterestSelectionScreen from './src/auth/InterestSelectionScreen';
import type { RootStackParamList } from './src/navigation/type';

import VocabularyBuilderScreen from './src/screens/topics/VocabularyBuilder/VocabularyBuilderScreen';
import VocabularyGameScreen from './src/screens/topics/VocabularyBuilder/VocabularyGameScreen';
import GrammarPracticeScreen from './src/screens/topics/GrammarPractice/GrammarPracticeScreen';
import ReadingComprehensionScreen from './src/screens/topics/ReadingComprehension/ReadingComprehensionScreen';
import FilipinoToEnglishScreen from './src/screens/topics/FilipinoToEnglish/FilipinoToEnglishScreen';
import SentenceConstructionScreen from './src/screens/topics/SentenceConstruction/SentenceConstructionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require('./assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('./assets/fonts/Poppins-Bold.ttf'),
    PoppinsSemiBold: require('./assets/fonts/Poppins-SemiBold.ttf'),
    PoppinsBoldItalic: require('./assets/fonts/Poppins-BoldItalic.ttf'),
  });

  // ✅ Global font override
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: 'PoppinsRegular' };

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerBackTitle: '', // ✅ Hides "Back" text globally
          headerTitleAlign: 'left', // ✅ Title aligned to the left
          headerShadowVisible: false, // ✅ Removes bottom border (iOS)
        }}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false, animation: 'none' }}
        />

        <Stack.Screen
          name="WordOfTheDay"
          component={WordOfTheDayScreen}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="Register"
          component={RegistrationForm}
          options={{
            headerBackTitle: '', // hides "Back" text on iOS
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitle: ' ', // no center title
            headerShadowVisible: false, // removes iOS bottom border
          }}
        />
        <Stack.Screen
          name="InterestSelection"
          component={InterestSelectionScreen}
          options={{
            headerBackTitle: '', // hides "Back" text on iOS
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitle: '', // no center title
            headerShadowVisible: false, // ✅ removes iOS bottom border
          }}
        />

        <Stack.Screen name="VocabularyBuilder" component={VocabularyBuilderScreen} />
        <Stack.Screen name="VocabularyGame" component={VocabularyGameScreen} />

        <Stack.Screen name="GrammarPractice" component={GrammarPracticeScreen} />

        <Stack.Screen name="ReadingComprehension" component={ReadingComprehensionScreen} />

        <Stack.Screen name="FilipinoToEnglish" component={FilipinoToEnglishScreen} />

        <Stack.Screen name="SentenceConstruction" component={SentenceConstructionScreen} />
        <Stack.Screen
          name="Progress"
          component={ProgressScreen}
          options={{ headerShown: false, animation: 'none' }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false, animation: 'none' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
