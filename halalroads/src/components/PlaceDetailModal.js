import React, { useEffect, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function PlaceDetailModal({ place, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const photoRef = place.photos?.[0]?.photo_reference;
  const photoUrl = photoRef
    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photoreference=${photoRef}&key=${MAPS_KEY}`
    : null;

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    try {
      const snap = await firestore()
        .collection('reviews')
        .where('placeId', '==', place.place_id)
        .orderBy('createdAt', 'desc')
        .get();
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // index may not be ready
    } finally {
      setLoadingReviews(false);
    }
  }

  async function submitReview() {
    if (!reviewText.trim()) {
      Alert.alert('Error', 'Please write a review.');
      return;
    }
    const user = auth().currentUser;
    setSubmitting(true);
    try {
      await firestore().collection('reviews').add({
        placeId: place.place_id,
        placeName: place.name,
        userId: user.uid,
        userName: user.displayName || user.email,
        rating,
        text: reviewText.trim(),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      setReviewText('');
      setRating(5);
      await fetchReviews();
      Alert.alert('Thanks!', 'Your review has been posted.');
    } catch {
      Alert.alert('Error', 'Could not submit review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>✕ Close</Text>
        </TouchableOpacity>

        <ScrollView>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder} />
          )}

          <View style={styles.body}>
            <Text style={styles.name}>{place.name}</Text>
            <Text style={styles.address}>{place.vicinity || place.formatted_address}</Text>
            {place.rating && (
              <Text style={styles.rating}>{place.rating} ★  ({place.user_ratings_total ?? 0} reviews)</Text>
            )}

            {place.opening_hours && (
              <Text style={styles.hours}>
                {place.opening_hours.open_now ? '🟢 Open now' : '🔴 Closed'}
              </Text>
            )}

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Write a Review</Text>

            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setRating(s)}>
                  <Text style={styles.star}>{s <= rating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={submitReview} disabled={submitting}>
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Post Review</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Community Reviews</Text>
            {loadingReviews ? (
              <ActivityIndicator color="#2E7D32" style={{ marginTop: 10 }} />
            ) : reviews.length === 0 ? (
              <Text style={styles.empty}>No reviews yet. Be the first!</Text>
            ) : (
              reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewUser}>{r.userName}</Text>
                    <Text style={styles.reviewRating}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  closeBtn: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  closeBtnText: { color: '#fff', fontWeight: '600' },
  photo: { width: '100%', height: 250 },
  photoPlaceholder: { width: '100%', height: 200, backgroundColor: '#e0e0e0' },
  body: { padding: 20 },
  name: { fontSize: 22, fontWeight: '700', color: '#212121', marginBottom: 6 },
  address: { fontSize: 14, color: '#757575', marginBottom: 8 },
  rating: { fontSize: 15, color: '#F9A825', marginBottom: 6 },
  hours: { fontSize: 14, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E0E0E0', marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 12 },
  star: { fontSize: 32, color: '#F9A825', marginRight: 4 },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  submitBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    elevation: 1,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  reviewUser: { fontWeight: '600', color: '#212121' },
  reviewRating: { color: '#F9A825' },
  reviewText: { color: '#424242', fontSize: 14 },
  empty: { color: '#9e9e9e', fontSize: 14 },
});
