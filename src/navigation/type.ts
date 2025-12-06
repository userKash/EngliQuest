export type RootStackParamList = {
  VocabularyGame: { levelId: string };
  GrammarGame: { levelId: string };
  ReadingGame: { levelId: string };
  FilipinoToEnglishGame: { levelId: string };
  SentenceConstructionGame: { levelId: string };

  Login: undefined;
  Register: undefined;
InterestSelection:
  | {
      fullName: string;
      email: string;
      password: string;
      mode?: undefined;
    }
  | {
      mode: "reQuest";
      fullName?: undefined;
      email?: undefined;
      password?: undefined;
    };
  Home: undefined;
  CloudLoading: undefined;
  Progress: undefined;
  Profile: undefined;
  WordOfTheDay: undefined;

  VocabularyBuilder: undefined;

  GrammarPractice: undefined;

  ReadingComprehension: undefined;

  FilipinoToEnglish: undefined;
  LoadingGeneration: undefined;
  SentenceConstruction: undefined;
  
};
