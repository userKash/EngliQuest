import { useState } from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Fontisto from '@expo/vector-icons/Fontisto';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/type';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Logged in user:', user);
      Alert.alert('Success', 'Login successful!');
      navigation.navigate('WordOfTheDay');
    } catch (error: any) {
      console.error(error);
      Alert.alert('Login Failed', error.message || 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
      </View>

      <View style={styles.descriptionDiv}>
        <Text style={styles.description}>Welcome! Sign in to continue learning</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.subcontainer}>
          <View style={styles.form}>
            <View style={styles.titlediv}>
              <Text style={styles.title}>Sign in</Text>
            </View>

            <Text style={styles.label}>Email</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: isEmailFocused ? '#5E67CC' : '#d1d5db' },
              ]}>
              <Fontisto name="email" size={20} color="#A2A2A2" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                { borderColor: isPasswordFocused ? '#5E67CC' : '#d1d5db' },
              ]}>
              <Feather name="lock" size={18} color="gray" style={styles.inputIcon} />
              <TextInput
                style={styles.inputField}
                placeholder="Enter your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <TouchableOpacity style={styles.googleButton}>
              <Image source={require('../../assets/googleIcon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continue with google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.linkText}>Sign up here</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 1,
    marginTop: 120,
  },
  logo: {
    width: 228,
    height: 120,
    resizeMode: 'contain',
  },
  descriptionDiv: {
    justifyContent: 'center',
  },
  description: {
    fontSize: 14,
    color: '#000',
    marginBottom: 15,
  },
  subcontainer: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    paddingVertical: 23,
  },
  form: {
    width: '100%',
  },
  titlediv: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  label: {
    color: '#374151',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#fff',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#111827',
  },
  googleIcon: {
    width: 15,
    height: 15,
    marginRight: 10,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    marginTop: 20,
  },
  googleButtonText: {
    textAlign: 'center',
    color: '#111111',
  },
  button: {
    backgroundColor: '#5E67CC',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#1f2937',
    fontSize: 14,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
