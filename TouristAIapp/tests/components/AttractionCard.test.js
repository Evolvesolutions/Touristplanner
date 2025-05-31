import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView } from 'react-native';
import axios from 'axios';


export default function TravelScreen() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const fetchTouristSpots = async () => {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct',
      {
        inputs: `Suggest top 5 famous tourist spots between ${from} and ${to} in India.`,
        parameters: {
          max_new_tokens: 150,
          temperature: 0.7,
        },
      },
      {
        headers: {
          Authorization: 'Bearer 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',
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data;
    if (data.error) {
      setError(data.error);
      setResult('');
    } else {
      setResult(data[0]?.generated_text || JSON.stringify(data));
      setError('');
    }
  } catch (err) {
    console.error(err);
    setError('Failed to fetch tourist places. Try again later.');
    setResult('');
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Tourist Spot Finder</Text>

      <Text style={styles.label}>From:</Text>
      <TextInput
        style={styles.input}
        value={from}
        onChangeText={setFrom}
        placeholder="Enter starting city"
      />

      <Text style={styles.label}>To:</Text>
      <TextInput
        style={styles.input}
        value={to}
        onChangeText={setTo}
        placeholder="Enter destination city"
      />

      <Button title="Find Tourist Spots" onPress={fetchTouristSpots} />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {result ? (
        <View style={styles.resultBox}>
          <Text style={styles.label}>Suggested Spots:</Text>
          <Text>{result}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 15,
  },
  input: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    marginTop: 5,
  },
  error: {
    color: 'red',
    marginTop: 15,
  },
  resultBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 5,
  },
});
