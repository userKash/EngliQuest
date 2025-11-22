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

// ⭐ GLOBAL MUSIC
import { MusicProvider } from "./src/context/MusicContext";

// ⭐ CLOUD LOADING
import CloudLoadingScreen from './src/components/CloudLoadingScreen';

// Topic Screens
import VocabularyBuilderScreen from './src/screens/topics/VocabularyBuilder/VocabularyBuilderScreen';
import VocabularyGameScreen from './src/screens/topics/VocabularyBuilder/VocabularyGameScreen';
import GrammarPracticeScreen from './src/screens/topics/GrammarPractice/GrammarPracticeScreen';
import GrammarGameScreen from './src/screens/topics/GrammarPractice/GrammarGameScreen';
import ReadingComprehensionScreen from './src/screens/topics/ReadingComprehension/ReadingComprehensionScreen';
import ReadingGameScreen from './src/screens/topics/ReadingComprehension/ReadingGameScreen';
import FilipinoToEnglishScreen from './src/screens/topics/FilipinoToEnglish/FilipinoToEnglishScreen';
import FilipinoToEnglishGameScreen from './src/screens/topics/FilipinoToEnglish/FilipinoToEnglishGameScreen';
import SentenceConstructionScreen from './src/screens/topics/SentenceConstruction/SentenceConstructionScreen';
import SentenceConstructionGameScreen from './src/screens/topics/SentenceConstruction/SentenceConstructionGameScreen';
import LoadingGenerationScreen from '~/components/LoadingGenerationScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require('./assets/fonts/Poppins-Regular.ttf'),
    PoppinsBold: require('./assets/fonts/Poppins-Bold.ttf'),
    PoppinsSemiBold: require('./assets/fonts/Poppins-SemiBold.ttf'),
    PoppinsBoldItalic: require('./assets/fonts/Poppins-BoldItalic.ttf'),
    PixelFont: require('./assets/fonts/PressStart2P-Regular.ttf'),
  });

  const navRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>(undefined);

  // Default font globally
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: 'PoppinsRegular' };

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: 'white' }} />;
  }

  return (
    <MusicProvider>
      <NavigationContainer
        ref={navRef}
        onReady={() => setCurrentRoute(navRef.getCurrentRoute()?.name)}
        onStateChange={() => setCurrentRoute(navRef.getCurrentRoute()?.name)}
      >
        <View style={{ flex: 1 }}>

          <Stack.Navigator
            screenOptions={{
              headerBackTitle: '',
              headerTitleAlign: 'left',
              headerShadowVisible: false,
            }}
          >

            {/* AUTH + MAIN SCREENS */}
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegistrationForm} />
            <Stack.Screen name="WordOfTheDay" component={WordOfTheDayScreen} options={{ headerShown: false }} />
            <Stack.Screen name="InterestSelection" component={InterestSelectionScreen} />

            {/* CLOUD LOADING SCREEN */}
            <Stack.Screen name="CloudLoading" component={CloudLoadingScreen} options={{ headerShown: false }} />

            {/* TOPIC SELECT SCREENS */}
            <Stack.Screen
              name="VocabularyBuilder"
              component={VocabularyBuilderScreen}
              options={{
                headerTitle: () => (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>Vocabulary Builder</Text>
                    <Text style={{ fontSize: 14, color: "#555" }}>Choose your difficulty level</Text>
                  </View>
                ),
                headerTitleAlign: "left",
              }}
            />
            <Stack.Screen name="VocabularyGame" component={VocabularyGameScreen} />

            <Stack.Screen
              name="GrammarPractice"
              component={GrammarPracticeScreen}
              options={{
                headerTitle: () => (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>Grammar Practice</Text>
                    <Text style={{ fontSize: 14, color: "#555" }}>Choose your difficulty level</Text>
                  </View>
                ),
                headerTitleAlign: "left",
              }}
            />
            <Stack.Screen name="GrammarGame" component={GrammarGameScreen} />

            <Stack.Screen
              name="ReadingComprehension"
              component={ReadingComprehensionScreen}
              options={{
                headerTitle: () => (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>Reading Comprehension</Text>
                    <Text style={{ fontSize: 14, color: "#555" }}>Choose your difficulty level</Text>
                  </View>
                ),
                headerTitleAlign: "left",
              }}
            />
            <Stack.Screen name="ReadingGame" component={ReadingGameScreen} />

            <Stack.Screen
              name="FilipinoToEnglish"
              component={FilipinoToEnglishScreen}
              options={{
                headerTitle: () => (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>Filipino to English</Text>
                    <Text style={{ fontSize: 14, color: "#555" }}>Choose your difficulty level</Text>
                  </View>
                ),
                headerTitleAlign: "left",
              }}
            />
            <Stack.Screen name="FilipinoToEnglishGame" component={FilipinoToEnglishGameScreen} />

            <Stack.Screen
              name="SentenceConstruction"
              component={SentenceConstructionScreen}
              options={{
                headerTitle: () => (
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "bold" }}>Sentence Construction</Text>
                    <Text style={{ fontSize: 14, color: "#555" }}>Choose your difficulty level</Text>
                  </View>
                ),
                headerTitleAlign: "left",
              }}
            />
            <Stack.Screen name="SentenceConstructionGame" component={SentenceConstructionGameScreen} />
            <Stack.Screen name="LoadingGeneration"component={LoadingGenerationScreen} options={{ headerShown: false }}/>
            {/* MAIN APP GROUP */}
            <Stack.Group screenOptions={{ animation: "fade_from_bottom", headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Group>
          </Stack.Navigator>

          {/* BOTTOM NAV ALWAYS SAFE */}
          {![
            "VocabularyGame",
            "GrammarGame",
            "ReadingGame",
            "FilipinoToEnglishGame",
            "SentenceConstructionGame",
            "CloudLoading",
            "LoadingGeneration",
          ].includes(currentRoute ?? "") && (
            <BottomNav
              currentRoute={currentRoute}
              onNavigate={(name) =>
                navRef.isReady() && navRef.navigate(name as never)
              }
            />
          )}

        </View>
      </NavigationContainer>
    </MusicProvider>
  );
}
