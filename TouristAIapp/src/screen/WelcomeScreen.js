import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true); // toggle login/register
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    const url = isLogin
      ? 'http://127.0.0.1:8000/api/login/'
      : 'http://127.0.0.1:8000/api/register/';

    try {
      const res = await axios.post(url, { email, password });

      if (res.data.status === 'success') {
        if (isLogin) {
          navigation.replace('Search');
        } else {
          Alert.alert('Success', 'Registered! Please log in.');
          setIsLogin(true);
          setEmail('');
          setPassword('');
        }
      } else {
        Alert.alert('Error', res.data.message || 'Something went wrong');
      }
    } catch (err) {
      Alert.alert('Error', 'Network or server issue');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/icon.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(30,60,114,0.6)', 'rgba(42,82,152,0.8)']}
        style={styles.container}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to TourMate</Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? 'Login to discover tourist places on your route.'
              : 'Register to get started with TourMate.'}
          </Text>

          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity onPress={handleAuth}>
            <LinearGradient
              colors={['#000000', '#ffb347']}
              style={styles.button}
            >
              <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Register'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? Register"
                : 'Already have an account? Login'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  background: { flex: 1, width: '100%', height: '100%' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 25,
    width: width * 0.88,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1e3c72',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginVertical: 10,
    padding: 10,
    borderRadius: 6,
  },
  button: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: 200,
  },
  buttonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  toggleText: {
    color: '#1e3c72',
    marginTop: 15,
    fontWeight: '600',
  },
});
