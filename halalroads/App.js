import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import auth from '@react-native-firebase/auth';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = auth().onAuthStateChanged((u) => setUser(u));
    return unsub;
  }, []);

  if (user === undefined) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return user ? <AppNavigator /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
});
