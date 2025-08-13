import { initializeApp } from 'firebase/app';
import { initializeAuth } from 'firebase/auth';
import type { Persistence } from 'firebase/auth'; 
import AsyncStorage from '@react-native-async-storage/async-storage';


// @ts-expect-error: it's a hidden export but exists at runtime
import { getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyC7AMHG2pEDsqL91NyTWlisA8YEl3SBxCA',
  authDomain: 'engliquest-788b6.firebaseapp.com',
  projectId: 'engliquest-788b6',
  storageBucket: 'engliquest-788b6.appspot.com',
  messagingSenderId: '1072058760841',
  appId: '1:1072058760841:web:664d901b651ba67d521058',
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage) as Persistence,
});
