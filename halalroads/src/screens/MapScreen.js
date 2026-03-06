import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import PlaceDetailModal from '../components/PlaceDetailModal';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is needed to show the map.');
      setLoading(false);
      return;
    }
    let loc = await Location.getLastKnownPositionAsync({});
    if (!loc) {
      loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    }
    setLocation(loc.coords);
    await fetchPlaces(loc.coords);
    setLoading(false);
  }

  async function fetchPlaces(coords) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.latitude},${coords.longitude}&radius=5000&keyword=halal&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) setPlaces(data.results);
    } catch {
      Alert.alert('Error', 'Could not load nearby places.');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Location unavailable.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
        showsMyLocationButton
      >
        {places.map((place) => (
          <Marker
            key={place.place_id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            pinColor="#2E7D32"
          >
            <Callout onPress={() => setSelectedPlace(place)}>
              <View style={styles.callout}>
                <Text style={styles.calloutName}>{place.name}</Text>
                <Text style={styles.calloutAddress} numberOfLines={1}>{place.vicinity}</Text>
                {place.rating && (
                  <Text style={styles.calloutRating}>{place.rating} ★</Text>
                )}
                <TouchableOpacity onPress={() => setSelectedPlace(place)}>
                  <Text style={styles.calloutDetails}>View details</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>{places.length} halal places nearby</Text>
      </View>

      {selectedPlace && (
        <PlaceDetailModal
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F5F5',
  },
  loadingText: { marginTop: 12, color: '#757575' },
  errorText: { color: '#c62828', fontSize: 16 },
  callout: { width: 200, padding: 4 },
  calloutName: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
  calloutAddress: { fontSize: 12, color: '#757575', marginBottom: 4 },
  calloutRating: { color: '#F9A825', fontSize: 12, marginBottom: 4 },
  calloutDetails: { color: '#2E7D32', fontWeight: '600', fontSize: 12 },
  badge: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
