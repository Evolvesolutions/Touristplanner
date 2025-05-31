import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getTouristRecommendations } from '../api';

// Fix Leaflet marker icon paths for web usage
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

  // Load Leaflet CSS dynamically
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
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
      setData(result);
    } catch (err) {
      console.error('API error:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMapCenterAndBounds = () => {
    if (!data) return { center: [20.5937, 78.9629], bounds: null }; // Default center India

    const { start_location, end_location, tourist_places } = data;

    const center = [
      (start_location.latitude + end_location.latitude) / 2,
      (start_location.longitude + end_location.longitude) / 2,
    ];

    const bounds = [
      [start_location.latitude, start_location.longitude],
      [end_location.latitude, end_location.longitude],
    ];

    if (tourist_places && tourist_places.length) {
      tourist_places.forEach(place => {
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

      <View style={styles.buttonContainer}>
        <Button
          title={loading ? "Searching..." : "Find Tourist Places"}
          onPress={handleSearch}
          disabled={loading}
          color="#007bff"
        />
      </View>

      {loading && <ActivityIndicator size="large" color="#007bff" style={styles.loader} />}

      {error && <Text style={styles.error}>{error}</Text>}

      {data && (
        <ScrollView style={styles.results}>

          {/* Route Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Information</Text>
            <Text>From: <Text style={styles.boldText}>{data.start_location.city}</Text></Text>
            <Text>To: <Text style={styles.boldText}>{data.end_location.city}</Text></Text>
            <Text>Distance: <Text style={styles.boldText}>{data.route.distance_km.toFixed(2)} km</Text></Text>
            <Text>Duration: <Text style={styles.boldText}>{data.route.duration_hours.toFixed(2)} hours</Text></Text>
          </View>

          {/* Map */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Route Map</Text>
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {/* Route Polyline */}
                {data.route.geometry && (
                  <Polyline
                    positions={data.route.geometry.map(coord => [coord[1], coord[0]])} // [lon, lat] → [lat, lon]
                    color="#007bff"
                    weight={4}
                    dashArray="5, 10"
                  />
                )}

                {/* Tourist Place Markers */}
                {data.tourist_places && data.tourist_places.map((place, idx) => (
                  <Marker key={idx} position={[place.latitude, place.longitude]}>
                    <Popup>
                      <Text style={styles.popupTitle}>{place.name}</Text>
                      <Text>{place.description || 'No description available.'}</Text>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </View>
          </View>

          {/* Tourist Places List */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Tourist Places ({data.total_places ?? data.tourist_places?.length ?? 0})</Text>
            {data.tourist_places && data.tourist_places.length > 0 ? (
              data.tourist_places.map((place, idx) => (
                <View key={idx} style={styles.placeItem}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text>Type: <Text style={styles.boldText}>{place.type || 'Unknown'}</Text></Text>
                  <Text>Distance from route: <Text style={styles.boldText}>{place.distance_km?.toFixed(2) ?? 'N/A'} km</Text></Text>
                  <Text>{place.description || 'No description available.'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noResultsText}>No tourist places found along this route.</Text>
            )}
          </View>

          {/* Recommendations */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            <Text>{data.recommendations || 'No specific recommendations available.'}</Text>
          </View>

        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, color: '#007bff' },
  input: { borderColor: '#ccc', borderWidth: 1, borderRadius: 5, padding: 10, marginBottom: 10, color: '#000' },
  buttonContainer: { marginBottom: 15 },
  loader: { marginVertical: 20 },
  error: { color: 'red', marginBottom: 15, fontWeight: 'bold' },
  results: { flex: 1 },
  card: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 8, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#007bff' },
  mapContainer: { height: 300, width: '100%' },
  map: { height: '100%', width: '100%' },
  popupTitle: { fontWeight: 'bold', marginBottom: 5 },
  placeItem: { marginBottom: 10 },
  placeName: { fontWeight: 'bold', fontSize: 16 },
  boldText: { fontWeight: 'bold' },
  noResultsText: { fontStyle: 'italic', color: '#666' },
});

export default TouristRecommendationScreen;
