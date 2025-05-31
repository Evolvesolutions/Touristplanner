// src/screen/HomeScreen.js

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Text,
} from 'react-native';
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

// Custom icons
const starIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png', // star icon
  iconSize: [30, 30],
});

const normalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png', // default marker icon
  iconSize: [25, 25],
});

const TouristRecommendationScreen = () => {
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!startCity.trim() || !endCity.trim()) {
      setError('Please enter both start and end cities.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getTouristRecommendations(startCity, endCity);
      setData(result);
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMapCenterAndBounds = () => {
    if (!data || !data.tourist_places || data.tourist_places.length === 0)
      return { center: [20.5937, 78.9629], bounds: null };

    const coords = data.tourist_places.map(p => [p.latitude, p.longitude]);
    const lats = coords.map(c => c[0]);
    const lngs = coords.map(c => c[1]);

    const center = [
      (Math.min(...lats) + Math.max(...lats)) / 2,
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
    ];

    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];

    return { center, bounds };
  };

  const topFive = data?.tourist_places?.filter(place =>
  data.highlighted?.includes(place.name)
  ) || [];
  console.log('Route geometry:', data?.route_geometry?.slice(0, 5));
  console.log('First place:', data?.tourist_places?.[0]);

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
          <Text style={styles.sectionTitle}>From: {startCity}</Text>
          <Text style={styles.sectionTitle}>To: {endCity}</Text>

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

              {/* Draw route polyline */}
              {data.route_geometry && data.route_geometry.length > 0 && (
                <Polyline
                  positions={data.route_geometry.map(coord => [coord[1], coord[0]])} // [lat, lng]
                  color="blue"
                  weight={4}
                />
              )}

              {/* Place markers */}
              {data.tourist_places.map((place, index) => (
                <Marker key={index} position={[place.latitude, place.longitude]}
                icon={data.highlighted?.includes(place.name) ? starIcon : normalIcon}>
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


          <Text style={styles.sectionTitle}>Top 5 Highlights</Text>
          {topFive.map((place, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.placeName}>{place.name}⭐</Text>
              <Text>Type: {place.category}</Text>
              <Text>Distance from route: {place.distance_from_route?.toFixed(2) || 'N/A'} km</Text>
              <Text>{place.description}</Text>
            </View>
          ))}

          <Text style={styles.sectionTitle}>All Tourist Places</Text>
          {console.log('Tourist places:', data.tourist_places)}
          {console.log('Route geometry:', data.route_geometry)}
          {console.log('Center & bounds:', getMapCenterAndBounds())}

          {data.tourist_places.map((place, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text>Type: {place.category}</Text>
              <Text>Distance from route: {place.distance_from_route?.toFixed(2) || 'N/A'} km</Text>
              <Text numberOfLines={2} ellipsizeMode="tail">
                {place.description}
              </Text>
              
            </View>
            
          ))}
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
    marginBottom: 4,
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
