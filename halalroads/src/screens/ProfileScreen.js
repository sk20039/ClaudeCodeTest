import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Alert, ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

export default function ProfileScreen() {
  const user = auth().currentUser;
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyReviews();
  }, []);

  async function fetchMyReviews() {
    try {
      const snap = await firestore()
        .collection('reviews')
        .where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .get();
      setReviews(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // index might not be ready yet, fail silently
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => auth().signOut(),
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.displayName || user.email)?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user.displayName || 'User'}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Reviews</Text>

      {loading ? (
        <ActivityIndicator color="#2E7D32" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewPlace}>{item.placeName}</Text>
              <Text style={styles.reviewRating}>{'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}</Text>
              <Text style={styles.reviewText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>You haven't written any reviews yet.</Text>
          }
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
  profileCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 3,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2E7D32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 4 },
  email: { fontSize: 14, color: '#757575', marginBottom: 20 },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#c62828',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  signOutText: { color: '#c62828', fontWeight: '600' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  reviewPlace: { fontWeight: '700', fontSize: 15, marginBottom: 4, color: '#212121' },
  reviewRating: { color: '#F9A825', fontSize: 16, marginBottom: 6 },
  reviewText: { color: '#424242', fontSize: 14 },
  empty: { textAlign: 'center', color: '#9e9e9e', marginTop: 20, fontSize: 15 },
});
