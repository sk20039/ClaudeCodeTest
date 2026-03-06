import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import GooglePlacesAutocomplete from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailModal from '../components/PlaceDetailModal';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function SearchScreen() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  async function handleSelect(data, details) {
    if (!details) return;
    setResults([details]);
  }

  async function searchNearby(query) {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let locationStr = '';
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        locationStr = `&location=${loc.coords.latitude},${loc.coords.longitude}&radius=10000`;
      }
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=halal+${encodeURIComponent(query)}${locationStr}&key=${MAPS_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.results) setResults(data.results);
      else setResults([]);
    } catch {
      Alert.alert('Error', 'Search failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search Halal Places</Text>
      </View>

      <View style={styles.searchWrapper}>
        <GooglePlacesAutocomplete
          placeholder="Search restaurants, groceries..."
          fetchDetails
          onPress={handleSelect}
          onFail={() => Alert.alert('Error', 'Autocomplete failed.')}
          query={{
            key: MAPS_KEY,
            language: 'en',
            keyword: 'halal',
          }}
          requestUrl={{
            useOnPlatform: 'web',
            url: 'https://maps.googleapis.com/maps/api',
          }}
          styles={{
            textInput: styles.searchInput,
            container: { flex: 0 },
            listView: { backgroundColor: '#fff' },
          }}
          renderRightButton={() => null}
          debounce={300}
          onChangeText={(text) => {
            if (text.length > 2) searchNearby(text);
          }}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => setSelectedPlace(item)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>Search for halal restaurants, groceries, and more.</Text>
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
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '700' },
  searchWrapper: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 14,
  },
  list: { padding: 16 },
  empty: {
    textAlign: 'center', color: '#9e9e9e', marginTop: 40, fontSize: 15, paddingHorizontal: 30,
  },
});
