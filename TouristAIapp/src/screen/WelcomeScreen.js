import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const WelcomeScreen = ({ navigation }) => {
  return (
    <ImageBackground
      source={require('../../assets/icon.png')} // your local background image
      style={styles.background}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(30,60,114,0.6)', 'rgba(42,82,152,0.8)']}
        style={styles.container}
      >
        <View style={styles.card}>
          <Image
            source={{
              uri: 'https://cdn.pixabay.com/photo/2017/08/07/01/47/travel-2594852_1280.jpg',
            }}
            style={styles.image}
            resizeMode="cover"
          />
          <Text style={styles.title}>Welcome to TourMate</Text>
          <Text style={styles.subtitle}>
            Discover top tourist attractions along your journey route.
          </Text>

          <TouchableOpacity onPress={() => navigation.navigate('Search')}>
            <LinearGradient
              colors={['#000000', '#ffb347']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 25,
    width: width * 0.88,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3c72',
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    margin: 30,
    paddingHorizontal: 10,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
