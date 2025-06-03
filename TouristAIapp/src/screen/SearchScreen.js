// src/screen/SearchScreen.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';

const SearchScreen = ({ navigation }) => {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');

  const handleSearch = () => {
    if (!startCity.trim() || !endCity.trim()) {
      Alert.alert('Validation Error', 'Please enter both start and end cities.');
      return;
    }

    // Navigate to recommendation screen with parameters
    navigation.navigate('TouristRecommendation', {
      startCity,
      endCity,
    });
  };

  return (

    
    <View style={styles.container}>
      <Text style={styles.title}>Tourist Route Planner</Text>

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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color:'white'
    
  },
  input: {
    borderWidth: 1,
    borderColor: 'white',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    color:'white',
  },
});

export default SearchScreen;
