export type RootStackParamList = {
  VocabularyGame: { levelId: string };
  Login: undefined;
  Register: undefined;
  InterestSelection: {
    fullName: string;
    email: string;
    password: string;
  };
  Home: undefined;
  Progress: undefined;
  Profile: undefined;
  WordOfTheDay: undefined;

  //VOCABULARY SCREENS NAVIGATIONS
  VocabularyBuilder: undefined;

  GrammarPractice: undefined;

  ReadingComprehension: undefined;

  FilipinoToEnglish: undefined;

  SentenceConstruction: undefined;
};
