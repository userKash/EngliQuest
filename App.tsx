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

import { MusicProvider } from "./src/context/MusicContext";

import CloudLoadingScreen from './src/components/CloudLoadingScreen';

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

import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>("Login");
  const [isAuthReady, setIsAuthReady] = useState(false);

useEffect(() => {
  const unsubscribe = auth().onAuthStateChanged(async (user) => {
    // User NOT logged in → go to Login
    if (!user) {
      setInitialRoute("Login");
      setIsAuthReady(true);
      return;
    }

    const uid = user.uid;

    // 1) LOCAL PERSISTENCE — if app was closed during generation
    const localGeneration = await AsyncStorage.getItem("GENERATION_STATUS");

    if (localGeneration === "pending") {
      setInitialRoute("LoadingGeneration");
      setIsAuthReady(true);
      return;
    }

    if (localGeneration === "completed") {
      setInitialRoute("Home");
      setIsAuthReady(true);
      return;
    }

    // 2) CHECK FIRESTORE QUIZZES — server truth
    const quizDoc = await firestore()
      .collection("quizzes")
      .doc(uid)
      .get();

    if (quizDoc.exists()) {
      const data = quizDoc.data();

      // If backend still generating content
      if (data?.status === "pending") {
        await AsyncStorage.setItem("GENERATION_STATUS", "pending");
        setInitialRoute("LoadingGeneration");
        setIsAuthReady(true);
        return;
      }

      // If backend finished generating
      if (data?.status === "completed" || data?.status === "approved") {
        await AsyncStorage.setItem("GENERATION_STATUS", "completed");
        setInitialRoute("Home");
        setIsAuthReady(true);
        return;
      }
    }

    // 3) If no quiz doc: user still onboarding → Interest Selection
    setInitialRoute("InterestSelection");
    setIsAuthReady(true);
  });

  return unsubscribe;
}, []);


  // Default font globally
  (Text as any).defaultProps = (Text as any).defaultProps || {};
  (Text as any).defaultProps.style = { fontFamily: 'PoppinsRegular' };

  useEffect(() => {
    if (fontsLoaded && isAuthReady) {
      SplashScreen.hideAsync(); // ✅ FIXED: MUST CALL THE FUNCTION
    }
  }, [fontsLoaded, isAuthReady]);

  if (!fontsLoaded || !isAuthReady) {
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
            initialRouteName={initialRoute}
            screenOptions={{
              headerBackTitle: '',
              headerTitleAlign: 'center',
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

            {/* CONTENT GENERATION LOADING */}
            <Stack.Screen name="LoadingGeneration" component={LoadingGenerationScreen} options={{ headerShown: false }} />

            {/* TOPIC SELECT SCREENS */}
            <Stack.Screen
              name="VocabularyBuilder"
              component={VocabularyBuilderScreen}
              options={{ title: "Vocabulary Builder" }}
            />
            <Stack.Screen name="VocabularyGame" component={VocabularyGameScreen} />
            <Stack.Screen
              name="GrammarPractice"
              component={GrammarPracticeScreen}
              options={{ title: "Grammar Practice" }}
            />
            <Stack.Screen name="GrammarGame" component={GrammarGameScreen} />
            <Stack.Screen
              name="ReadingComprehension"
              component={ReadingComprehensionScreen}
              options={{ title: "Reading Comprehension" }}
            />
            <Stack.Screen name="ReadingGame" component={ReadingGameScreen} />
            <Stack.Screen
              name="FilipinoToEnglish"
              component={FilipinoToEnglishScreen}
              options={{ title: "Filipino to English" }}
            />
            <Stack.Screen name="FilipinoToEnglishGame" component={FilipinoToEnglishGameScreen} />
            <Stack.Screen
              name="SentenceConstruction"
              component={SentenceConstructionScreen}
              options={{ title: "Sentence Construction" }}
            />
            <Stack.Screen name="SentenceConstructionGame" component={SentenceConstructionGameScreen} />

            {/* MAIN APP GROUP */}
            <Stack.Group screenOptions={{ animation: "fade_from_bottom", headerShown: false }}>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Progress" component={ProgressScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
            </Stack.Group>

          </Stack.Navigator>

          {/* Bottom Navigation */}
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
