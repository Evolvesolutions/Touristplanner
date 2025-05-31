// TouristRecommendationScreen.js


import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet for custom icons
import { getTouristRecommendations } from '../api';

// Fix for default Leaflet marker icons in web (they might not load due to webpack issues)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TouristRecommendationScreen = () => {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ensure Leaflet CSS is loaded dynamically if not added in index.html
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link); // Cleanup on unmount
    };
  }, []);

  const handleSearch = async () => {
    if (!startCity.trim() || !endCity.trim()) {
      setError('Please enter both cities');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await getTouristRecommendations(startCity.trim(), endCity.trim());
      console.log('API Response:', result);
      setData(result);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate initial center and bounds for the map
  const getMapCenterAndBounds = () => {
    if (!data) return { center: [20.5937, 78.9629], bounds: null }; // Default to center of India

    const { start_location, end_location } = data;
    const center = [
      (start_location.latitude + end_location.latitude) / 2,
      (start_location.longitude + end_location.longitude) / 2,
    ];

    // Calculate bounds to fit the route and markers
    const bounds = [
      [start_location.latitude, start_location.longitude],
      [end_location.latitude, end_location.longitude],
    ];

    if (data.tourist_places) {
      data.tourist_places.forEach(place => {
        bounds.push([place.latitude, place.longitude]);
      });
    }

    return { center, bounds };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tourist Route Planner</Text>
      
      <TextInput
        style={styles.input}
        placeholder="From City (e.g. Mumbai)"
        value={startCity}
        onChangeText={setStartCity}
        placeholderTextColor="#888" // Added for better placeholder visibility
      />
      
      <TextInput
        style={styles.input}
        placeholder="To City (e.g. Delhi)"
        value={endCity}
        onChangeText={setEndCity}
        placeholderTextColor="#888" // Added for better placeholder visibility
      />
      
      <View style={styles.buttonContainer}> {/* Added container for button styling */}
        <Button 
          title={loading ? "Searching..." : "Find Tourist Places"} 
          onPress={handleSearch} 
          disabled={loading}
          color="#007bff" // Primary button color
        />
      </View>
      
      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />} {/* Changed color */}
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      {data && (
        <ScrollView style={styles.results}>
          {/* Route Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            <Text style={styles.detailText}>From: <Text style={styles.boldText}>{data.start_location.city}</Text></Text>
            <Text style={styles.detailText}>To: <Text style={styles.boldText}>{data.end_location.city}</Text></Text>
            <Text style={styles.detailText}>Distance: <Text style={styles.boldText}>{data.route.distance_km.toFixed(2)} km</Text></Text> {/* Formatted */}
            <Text style={styles.detailText}>Duration: <Text style={styles.boldText}>{data.route.duration_hours.toFixed(2)} hours</Text></Text> {/* Formatted */}
          </View>
          
          {/* Map */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Map</Text>
            <View style={styles.mapContainer}>
              <MapContainer
                center={getMapCenterAndBounds().center}
                zoom={5} // Initial zoom level
                style={styles.map}
                bounds={getMapCenterAndBounds().bounds}
                boundsOptions={{ padding: [50, 50] }}
              >
                {/* OSM Tile Layer */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                
                {/* Route Polyline */}
                {data.route.geometry && (
                  <Polyline
                    positions={data.route.geometry.map(coord => [coord[1], coord[0]])} // OSRM gives [lon, lat], Leaflet expects [lat, lon]
                    color="#007bff" // Changed to primary blue
                    weight={4} // Slightly thicker
                    dashArray="5, 10" // Dotted line for distinction
                  />
                )}
                
                {/* Tourist Place Markers */}

                {data.tourist_places && data.tourist_places.map((place, index) => (
                  <Marker
                    key={index}
                    position={[place.latitude, place.longitude]}
                  >
                    <Popup>
                      <Text style={styles.popupTitle}>{place.name}</Text>
                      <Text style={styles.popupDescription}>{place.description}</Text>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </View>
          </View>
          
          {/* Tourist Places List */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tourist Places ({data.total_places || data.tourist_places?.length || 0})</Text> {/* Added fallback for total_places */}
            {data.tourist_places && data.tourist_places.length > 0 ? (
              data.tourist_places.map((place, index) => (
                <View key={index} style={styles.placeItem}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeDetail}>Type: <Text style={styles.boldText}>{place.type}</Text></Text>
                  <Text style={styles.placeDetail}>Distance from route: <Text style={styles.boldText}>{place.distance_km.toFixed(2)} km</Text></Text>
                  <Text style={styles.description}>{place.description}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noResultsText}>No tourist places found along this route.</Text>
            )}
          </View>
          
          {/* Recommendations */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text style={styles.recommendations}>{data.recommendations || 'No specific recommendations available.'}</Text> {/* Added fallback */}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

// Styles
const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)', // Gradient background (for web, use expo-linear-gradient for native)
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1a2980',
    marginBottom: 28,
    textAlign: 'center',
    letterSpacing: 1.2,
    textShadowColor: '#a1c4fd',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    fontFamily: 'serif',
  },
  input: {
    borderWidth: 1,
    borderColor: '#a1c4fd',
    padding: 14,
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    fontSize: 17,
    color: '#34495e',
    fontFamily: 'sans-serif-medium',
    shadowColor: '#a1c4fd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#1a2980',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    backgroundColor: 'linear-gradient(90deg, #1a2980 0%, #26d0ce 100%)',
  },
  loader: {
    marginTop: 32,
    marginBottom: 24,
  },
  error: {
    color: '#e74c3c',
    marginTop: 18,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: 'monospace',
  },
  results: {
    marginTop: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    elevation: 7,
    shadowColor: '#26d0ce',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    borderWidth: 1.5,
    borderColor: '#a1c4fd',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#26d0ce',
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: '#a1c4fd',
    paddingBottom: 10,
    letterSpacing: 1,
    fontFamily: 'serif',
    textShadowColor: '#e0eafc',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  detailText: {
    fontSize: 16,
    color: '#555',
    marginBottom: 7,
    fontFamily: 'sans-serif',
  },
  boldText: {
    fontWeight: 'bold',
    color: '#1a2980',
    fontSize: 16,
    fontFamily: 'sans-serif-medium',
  },
  placeItem: {
    backgroundColor: 'linear-gradient(90deg, #e0eafc 0%, #cfdef3 100%)',
    padding: 18,
    marginBottom: 14,
    borderRadius: 10,
    borderLeftWidth: 5,
    borderLeftColor: '#26d0ce',
    elevation: 3,
    shadowColor: '#a1c4fd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  placeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2980',
    marginBottom: 7,
    fontFamily: 'serif',
  },
  placeDetail: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
    fontFamily: 'sans-serif',
  },
  description: {
    marginTop: 10,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#777',
    lineHeight: 22,
    fontFamily: 'serif',
  },
  recommendations: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    fontStyle: 'italic',
    textAlign: 'justify',
    fontFamily: 'sans-serif-light',
  },
  noResultsText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    paddingVertical: 12,
    fontFamily: 'monospace',
  },
  mapContainer: {
    width: width - 40,
    height: height * 0.45,
    marginBottom: 24,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#a1c4fd',
    backgroundColor: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
    elevation: 5,
    shadowColor: '#26d0ce',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  popupTitle: {
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 6,
    color: '#1a2980',
    fontFamily: 'serif',
  },
  popupDescription: {
    fontSize: 15,
    color: '#555',
    fontFamily: 'sans-serif',
  },
});

export default TouristRecommendationScreen;


// updated main

import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator, Dimensions, Text } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getTouristRecommendations } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TouristRecommendationScreen = () => {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!startCity.trim() || !endCity.trim()) {
      setError('Please enter both cities');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const result = await getTouristRecommendations(startCity.trim(), endCity.trim());
      setData(result);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMapCenterAndBounds = () => {
    if (!data) return { center: [20.5937, 78.9629], bounds: null };

    const { start_location, end_location } = data;
    const center = [
      (start_location.latitude + end_location.latitude) / 2,
      (start_location.longitude + end_location.longitude) / 2,
    ];

    const bounds = [
      [start_location.latitude, start_location.longitude],
      [end_location.latitude, end_location.longitude],
    ];

    if (data.tourist_places) {
      data.tourist_places.forEach(place => {
        bounds.push([place.latitude, place.longitude]);
      });
    }

    return { center, bounds };
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tourist Route Planner</Text>

      <TextInput
        style={styles.input}
        placeholder="From City (e.g. Mumbai)"
        value={startCity}
        onChangeText={setStartCity}
        placeholderTextColor="#888"
      />
      <TextInput
        style={styles.input}
        placeholder="To City (e.g. Delhi)"
        value={endCity}
        onChangeText={setEndCity}
        placeholderTextColor="#888"
      />
      <Button
        title={loading ? "Searching..." : "Find Tourist Places"}
        onPress={handleSearch}
        disabled={loading}
        color="#007bff"
      />

      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}
      {error && <Text style={styles.error}>{error}</Text>}

      {data && (
        <ScrollView style={styles.results}>
          <Text style={styles.sectionTitle}>From: {data.start_location.city}</Text>
          <Text style={styles.sectionTitle}>To: {data.end_location.city}</Text>
          <Text>Distance: {data.route.distance_km.toFixed(2)} km</Text>
          <Text>Duration: {data.route.duration_hours.toFixed(2)} hours</Text>

          <View style={styles.mapContainer}>
            <MapContainer
              center={getMapCenterAndBounds().center}
              zoom={5}
              style={styles.map}
              bounds={getMapCenterAndBounds().bounds}
              boundsOptions={{ padding: [50, 50] }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {data.route.geometry && (
                <Polyline
                  positions={data.route.geometry.map(coord => [coord[1], coord[0]])}
                  color="blue"
                  weight={4}
                />
              )}
              {data.tourist_places && data.tourist_places.map((place, index) => (
                <Marker key={index} position={[place.latitude, place.longitude]}>
                  <Popup>
                    <div>
                      <strong>{place.name}</strong><br />
                      <small>{place.description}</small>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </View>

          <Text style={styles.sectionTitle}>Tourist Places</Text>
          {data.tourist_places.map((place, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text>Type: {place.type}</Text>
              <Text>Distance from route: {place.distance_km.toFixed(2)} km</Text>
              <Text>{place.description}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Recommendations</Text>
          <Text>{data.recommendations}</Text>
        </ScrollView>
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  results: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  card: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  placeName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    width: width - 40,
    height: height * 0.4,
    marginBottom: 20,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});

export default TouristRecommendationScreen;

// api/index.js

// api.js
import axios from 'axios';

export const getTouristRecommendations = async (startCity, endCity) => {
  try {
    const response = await axios.post(
      "http://127.0.0.1:8000/api/recommendations/",
      {
        start_city: startCity,
        end_city: endCity,
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};



// main/index.js

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// app.js

import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import TouristRecommendationScreen from './src/screen/HomeScreen';
// import TouristRecommendationScreen from '.screens/TouristRecommendationScreen';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar />
      < TouristRecommendationScreen/>
    </SafeAreaView>
  );
};

export default App;