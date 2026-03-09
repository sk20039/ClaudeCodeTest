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
  const [searchText, setSearchText] = useState('');
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
    setSearchText('');
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

  async function handleAddressSearch() {
    const query = searchText.trim();
    if (!query) return;
    setLoading(true);
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results?.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        const coords = { latitude: lat, longitude: lng };
        setLocation(coords);
        setLocationLabel(data.results[0].formatted_address);
        fetchPlaces(coords, category);
      } else {
        Alert.alert('Not found', 'Could not find that location. Try a different address.');
        setLoading(false);
      }
    } catch {
      Alert.alert('Error', 'Could not search that location. Check your connection.');
      setLoading(false);
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
        <Text style={styles.headerTitle}>Halal Places Near You</Text>

        {/* Location search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter a city or address..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleAddressSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleAddressSearch}>
            <Text style={styles.searchBtnIcon}>🔍</Text>
          </TouchableOpacity>
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
    paddingHorizontal: 16,
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnIcon: { fontSize: 18 },
  locateBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateIcon: { fontSize: 20 },
  locationLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 8 },
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
