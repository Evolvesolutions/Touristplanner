// src/screen/TouristRecommendationScreen.js

import React, { useEffect, useState } from 'react';
import {
  View,
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

// Marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const starIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1828/1828884.png',
  iconSize: [30, 30],
});

const normalIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
  iconSize: [25, 25],
});

const TouristRecommendationScreen = ({ route }) => {
  const { startCity, endCity } = route.params;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const result = await getTouristRecommendations(startCity, endCity);
        setData(result);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch tourist data');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [startCity, endCity]);

  const getMapCenterAndBounds = () => {
    if (!data || !data.tourist_places?.length) {
      return { center: [20.5937, 78.9629], bounds: null };
    }

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

  if (loading) {
    return <ActivityIndicator size="large" color="#007bff" style={styles.loader} />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tourist Route</Text>

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
          {data.route_geometry && (
            <Polyline
              positions={data.route_geometry.map(coord => [coord[1], coord[0]])}
              color="blue"
              weight={4}
            />
          )}
          {data.tourist_places.map((place, index) => (
            <Marker
              key={index}
              position={[place.latitude, place.longitude]}
              icon={data.highlighted?.includes(place.name) ? starIcon : normalIcon}
            >
              <Popup>
                <strong>{place.name}</strong><br />
                <small>{place.description}</small>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>

      <ScrollView style={styles.results}>
        <Text style={styles.sectionTitle}>Top 5 Highlights</Text>
        {topFive.map((place, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.placeName}>{place.name} ⭐</Text>
            <Text>Type: {place.category}</Text>
            <Text>Distance from route: {place.distance_from_route?.toFixed(2)} km</Text>
            <Text>{place.description}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>All Tourist Places</Text>
        {data.tourist_places.map((place, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.placeName}>{place.name}</Text>
            <Text>Type: {place.category}</Text>
            <Text>Distance from route: {place.distance_from_route?.toFixed(2)} km</Text>
            <Text numberOfLines={2} ellipsizeMode="tail">
              {place.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1e3c72',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color:'white',

  },
  loader: {
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    color:'white'
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
  results: {
    marginTop: 10,
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
});

export default TouristRecommendationScreen;
