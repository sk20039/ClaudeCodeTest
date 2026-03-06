import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function PlaceCard({ place, onPress }) {
  const photoRef = place.photos?.[0]?.photo_reference;
  const photoUrl = photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${MAPS_KEY}`
    : null;

  const category = place.types?.[0]?.replace(/_/g, ' ') ?? 'place';
  const rating = place.rating ? `${place.rating} ★` : 'No rating';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>No Photo</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
        <Text style={styles.address} numberOfLines={1}>{place.vicinity}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>{rating}</Text>
          <Text style={styles.category}>{category}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  image: {
    width: '100%',
    height: 150,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#9e9e9e',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rating: {
    fontSize: 13,
    color: '#F9A825',
    fontWeight: '600',
  },
  category: {
    fontSize: 12,
    color: '#fff',
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    textTransform: 'capitalize',
  },
});
