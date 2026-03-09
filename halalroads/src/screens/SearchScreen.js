import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailModal from '../components/PlaceDetailModal';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

// Decode a Google encoded polyline into [{lat, lng}] points
function decodePolyline(encoded) {
  const points = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Distance between two points in km
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Sample one point every intervalKm along the route
function sampleRoutePoints(points, intervalKm = 60) {
  if (!points.length) return [];
  const samples = [points[0]];
  let dist = 0;
  for (let i = 1; i < points.length; i++) {
    dist += haversineKm(points[i - 1], points[i]);
    if (dist >= intervalKm) { samples.push(points[i]); dist = 0; }
  }
  const last = points[points.length - 1];
  if (haversineKm(samples[samples.length - 1], last) > 10) samples.push(last);
  return samples;
}

export default function SearchScreen() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);

  async function handleUseMyLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location access is needed to auto-fill your starting point.');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const results = await Location.reverseGeocodeAsync(loc.coords);
      if (results?.length > 0) {
        const { city, region, country } = results[0];
        setOrigin([city, region, country].filter(Boolean).join(', '));
      } else {
        setOrigin(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
      }
    } catch {
      Alert.alert('Error', 'Could not get your location. Try again.');
    } finally {
      setLocating(false);
    }
  }

  async function findHalalStops() {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert('Missing info', 'Please enter both a starting point and destination.');
      return;
    }
    setLoading(true);
    setResults([]);
    setRouteInfo(null);
    try {
      // 1. Get route
      const dirRes = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${MAPS_KEY}`
      );
      const dirData = await dirRes.json();

      if (dirData.status !== 'OK' || !dirData.routes.length) {
        const msg = dirData.status === 'REQUEST_DENIED'
          ? 'Directions API is not enabled. Please enable it in Google Cloud Console.'
          : dirData.status === 'NOT_FOUND' || dirData.status === 'ZERO_RESULTS'
          ? 'Could not find a route. Try adding a state/country (e.g. "Houston, TX").'
          : `Could not get route (${dirData.status}). Check your API key.`;
        Alert.alert('Route not found', msg);
        setLoading(false);
        return;
      }

      const leg = dirData.routes[0].legs[0];
      setRouteInfo({ distance: leg.distance.text, duration: leg.duration.text });

      // 2. Decode polyline and sample stops every ~60 km
      const points = decodePolyline(dirData.routes[0].overview_polyline.points);
      const stops = sampleRoutePoints(points, 60).slice(0, 7); // max 7 API calls

      // 3. Fetch halal places near each stop in parallel
      const placeMap = new Map();
      await Promise.all(stops.map(async (pt) => {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${pt.lat},${pt.lng}&radius=8000&keyword=halal+food&key=${MAPS_KEY}`
        );
        const data = await res.json();
        if (data.results) data.results.slice(0, 4).forEach(p => placeMap.set(p.place_id, p));
      }));

      const places = Array.from(placeMap.values());
      if (!places.length) Alert.alert('No results', 'No halal places found along this route.');
      setResults(places);
    } catch {
      Alert.alert('Error', 'Something went wrong. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Halal Detour Finder</Text>
        <Text style={styles.headerSub}>Find halal stops along your route</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputRow}>
          <View style={styles.dot} />
          <TextInput
            style={styles.input}
            placeholder="From  (e.g. Houston, TX)"
            placeholderTextColor="#9e9e9e"
            value={origin}
            onChangeText={setOrigin}
            returnKeyType="next"
          />
          <TouchableOpacity style={styles.locateBtn} onPress={handleUseMyLocation} disabled={locating}>
            {locating
              ? <ActivityIndicator size="small" color="#2E7D32" />
              : <Text style={styles.locateIcon}>📍</Text>
            }
          </TouchableOpacity>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.inputRow}>
          <View style={[styles.dot, styles.dotDestination]} />
          <TextInput
            style={styles.input}
            placeholder="To  (e.g. Dallas, TX)"
            placeholderTextColor="#9e9e9e"
            value={destination}
            onChangeText={setDestination}
            returnKeyType="search"
            onSubmitEditing={findHalalStops}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={findHalalStops} disabled={loading}>
          <Text style={styles.buttonText}>Find Halal Stops</Text>
        </TouchableOpacity>
      </View>

      {routeInfo && (
        <View style={styles.routeBanner}>
          <Text style={styles.routeStats}>{routeInfo.distance}  •  {routeInfo.duration}</Text>
          <Text style={styles.routeCount}>{results.length} halal stops found along the way</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Searching for halal stops along your route...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <PlaceCard place={item} onPress={() => setSelectedPlace(item)} />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            !routeInfo ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🛣️</Text>
                <Text style={styles.emptyTitle}>Plan your halal road trip</Text>
                <Text style={styles.emptyText}>
                  Enter your starting point and destination to find halal restaurants and grocery stores along the way.
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {selectedPlace && (
        <PlaceDetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
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
  headerSub: { color: '#A5D6A7', fontSize: 13, marginTop: 2 },
  form: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 14,
    padding: 16,
    elevation: 3,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
  },
  dotDestination: {
    backgroundColor: '#c62828',
  },
  routeLine: {
    width: 2,
    height: 14,
    backgroundColor: '#E0E0E0',
    marginLeft: 5,
    marginVertical: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#FAFAFA',
    color: '#212121',
  },
  locateBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  locateIcon: { fontSize: 18 },
  button: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  routeBanner: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    padding: 12,
  },
  routeStats: { color: '#2E7D32', fontWeight: '700', fontSize: 14 },
  routeCount: { color: '#555', fontSize: 13, marginTop: 2 },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: { color: '#757575', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
  list: { padding: 16 },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 40,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 8 },
  emptyText: { textAlign: 'center', color: '#9e9e9e', fontSize: 14, lineHeight: 22 },
});
