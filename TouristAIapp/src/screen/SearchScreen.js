import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; // Make sure to install expo vector icons or use another icon library

const SearchScreen = ({ navigation }) => {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');

  const handleSearch = () => {
    if (!startCity.trim() || !endCity.trim()) {
      Alert.alert('Validation Error', 'Please enter both start and end cities.');
      return;
    }

    navigation.navigate('TouristRecommendation', {
      startCity,
      endCity,
    });
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    navigation.replace('welcome');
  };

  const handleBack = () => {
    navigation.replace('welcome'); // Navigates to the previous screen
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Tourist Route Planner</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="From City (e.g. Mumbai)"
        value={startCity}
        onChangeText={setStartCity}
        placeholderTextColor="white"
      />
      <TextInput
        style={styles.input}
        placeholder="To City (e.g. Delhi)"
        value={endCity}
        onChangeText={setEndCity}
        placeholderTextColor="white"
      />
      <Button
        title="Find Tourist Places"
        onPress={handleSearch}
        color="#007bff"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1e3c72',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  logout: {
    color: '#ff4d4d',
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    color: 'white',
  },
});

export default SearchScreen;
