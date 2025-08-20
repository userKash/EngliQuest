import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import BottomNav from './src/components/BottomNav';
import type { RootStackParamList } from './src/navigation/type';

import LoginScreen from './src/auth/Login';
import WordOfTheDayScreen from './src/screens/WordOfTheDay';
import HomeScreen from './src/screens/home';
import ProgressScreen from './src/screens/ProgressScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegistrationForm from './src/auth/Registration';
import InterestSelectionScreen from './src/auth/InterestSelectionScreen';

import VocabularyBuilderScreen from './src/screens/topics/VocabularyBuilder/VocabularyBuilderScreen';
import VocabularyGameScreen from './src/screens/topics/VocabularyBuilder/VocabularyGameScreen';
import GrammarPracticeScreen from './src/screens/topics/GrammarPractice/GrammarPracticeScreen';
import GrammarGameScreen from './src/screens/topics/GrammarPractice/GrammarGameScreen';
import ReadingComprehensionScreen from './src/screens/topics/ReadingComprehension/ReadingComprehensionScreen';
import ReadingGameScreen from './src/screens/topics/ReadingComprehension/ReadingGameScreen';
import FilipinoToEnglishScreen from './src/screens/topics/FilipinoToEnglish/FilipinoToEnglishScreen';
import FilipinoToEnglishGameScreen from './src/screens/topics/FilipinoToEnglish/FilipinoToEnglishGameScreen';
import SentenceConstructionScreen from './src/screens/topics/SentenceConstruction/SentenceConstructionScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require('./assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('./assets/fonts/Poppins-Bold.ttf'),
    PoppinsSemiBold: require('./assets/fonts/Poppins-SemiBold.ttf'),
    PoppinsBoldItalic: require('./assets/fonts/Poppins-BoldItalic.ttf'),
  });

  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: 'PoppinsRegular' };

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // 🔗 Ref + route tracking
  const navRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => setCurrentRoute(navRef.getCurrentRoute()?.name)}
      onStateChange={() => setCurrentRoute(navRef.getCurrentRoute()?.name)}>
      <View style={{ flex: 1 }}>
        <Stack.Navigator
          screenOptions={{
            headerBackTitle: '',
            headerTitleAlign: 'left',
            headerShadowVisible: false,
          }}>
          {/* your screens exactly as before */}
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="WordOfTheDay"
            component={WordOfTheDayScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Register" component={RegistrationForm} />
          <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />
          <Stack.Screen name="VocabularyBuilder" component={VocabularyBuilderScreen} />
          <Stack.Screen name="VocabularyGame" component={VocabularyGameScreen} />
          <Stack.Screen name="GrammarPractice" component={GrammarPracticeScreen} />
          <Stack.Screen name="GrammarGame" component={GrammarGameScreen} />
          <Stack.Screen name="ReadingComprehension" component={ReadingComprehensionScreen} />
          <Stack.Screen name="ReadingGame" component={ReadingGameScreen} />
          <Stack.Screen name="FilipinoToEnglish" component={FilipinoToEnglishScreen} />
          <Stack.Screen name="FilipinoToEnglishGame" component={FilipinoToEnglishGameScreen} />
          <Stack.Screen name="SentenceConstruction" component={SentenceConstructionScreen} />
          <Stack.Screen
            name="Progress"
            component={ProgressScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
        </Stack.Navigator>

        <BottomNav
          currentRoute={currentRoute}
          onNavigate={(name) => navRef.isReady() && navRef.navigate(name as never)}
        />
      </View>
    </NavigationContainer>
  );
}
