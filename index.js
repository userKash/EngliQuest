// index.js
import { registerRootComponent } from 'expo';
import App from './App';
import Constants from 'expo-constants';

if (Constants.appOwnership !== 'expo') {
  // Only configure Google Sign-In in dev build / APK (not Expo Go)
  import('@react-native-google-signin/google-signin').then(({ GoogleSignin }) => {
    GoogleSignin.configure({
      webClientId:
        '1072058760841-l2dfoc318glg28rlrubevsl0447alikd.apps.googleusercontent.com',
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  });
}

registerRootComponent(App);
