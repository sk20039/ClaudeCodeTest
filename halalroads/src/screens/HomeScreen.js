import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, Alert, TouchableOpacity, TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailModal from '../components/PlaceDetailModal';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const CATEGORIES = ['All', 'Restaurant', 'Grocery', 'Bakery', 'Cafe', 'Food'];

export default function HomeScreen() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [locating, setLocating] = useState(false);
  const [category, setCategory] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    requestLocationAndFetch();
  }, []);

  useEffect(() => {
    if (location) fetchPlaces(location, category);
  }, [category]);

  async function requestLocationAndFetch() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location access is needed to find halal places near you.');
      setLoading(false);
      return;
    }
    let loc = await Location.getLastKnownPositionAsync({});
    if (!loc) {
      loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    }
    setLocation(loc.coords);
    reverseGeocode(loc.coords);
    fetchPlaces(loc.coords, category);
  }

  async function handleLocateMe() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to find halal places near you.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(loc.coords);
      reverseGeocode(loc.coords);
      fetchPlaces(loc.coords, category);
    } catch {
      Alert.alert('Error', 'Could not get your location. Try again.');
    } finally {
      setLocating(false);
    }
  }

  async function reverseGeocode(coords) {
    try {
      const results = await Location.reverseGeocodeAsync(coords);
      if (results?.length > 0) {
        const { city, region, country } = results[0];
        setLocationLabel([city, region, country].filter(Boolean).join(', '));
      }
    } catch {
      // fail silently
    }
  }

  async function fetchPlaces(coords, cat) {
    setLoading(true);
    try {
      const keyword = cat === 'All' ? 'halal' : `halal ${cat.toLowerCase()}`;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coords.latitude},${coords.longitude}&radius=5000&keyword=${encodeURIComponent(keyword)}&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) setPlaces(data.results);
    } catch {
      Alert.alert('Error', 'Could not load places. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (location) fetchPlaces(location, category);
  }, [location, category]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Halal Places Near You</Text>
          <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.locateIcon}>📍</Text>
            }
          </TouchableOpacity>
        </View>
        {locationLabel ? (
          <Text style={styles.locationLabel}>📌 {locationLabel}</Text>
        ) : null}
      </View>

      {/* Category filter */}
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => setSelectedPlace(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No halal places found nearby.</Text>
          }
        />
      )}

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
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#2E7D32',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  locateBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateIcon: { fontSize: 20 },
  locationLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 6 },
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    flexWrap: 'wrap',
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
  },
  catChipActive: { backgroundColor: '#2E7D32' },
  catText: { color: '#2E7D32', fontSize: 13, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  list: { padding: 16 },
  empty: { textAlign: 'center', color: '#9e9e9e', marginTop: 40, fontSize: 15 },
});
