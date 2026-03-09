# CLAUDE.md — HalalRoads

React Native + Expo app for finding halal food along routes. Part of the Ali Hope Foundation.

## Project Overview

- **Framework:** React Native + Expo (expo-dev-client, NOT Expo Go)
- **Auth/DB:** `@react-native-firebase` — Firebase Auth (Email/Password) + Firestore
- **Maps:** `react-native-maps` (Google Maps)
- **Firebase project:** `halalroads-94454`
- **Android package:** `com.halalroads.app`
- **Brand color:** Ali Hope Foundation orange `#F1AE44`

## Features

- **Login / Sign Up** — Firebase Auth (Email/Password)
- **Home tab** — nearby halal places via Google Places Nearby Search API, with category filters
- **Map tab** — Google Maps with halal place markers (`react-native-maps`)
- **Search tab** — "Halal Detour Finder": enter From/To, fetches halal stops along route via Directions API
- **Profile tab** — user info, sign-out, user's Firestore reviews

## File Structure

```
halalroads/
├── App.js                         # Root; Firebase Auth state → LoginScreen or AppNavigator
├── index.js                       # Entry point (registerRootComponent)
├── app.config.js                  # Expo config; Maps API key from EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
├── src/
│   ├── config/firebase.js         # Exports auth + firestore from @react-native-firebase
│   ├── navigation/AppNavigator.js # Bottom tab navigator (Home, Map, Search, Profile)
│   ├── screens/
│   │   ├── LoginScreen.js
│   │   ├── HomeScreen.js
│   │   ├── MapScreen.js
│   │   ├── SearchScreen.js        # Contains polyline decode + Haversine helpers
│   │   └── ProfileScreen.js
│   └── components/
│       ├── PlaceCard.js
│       └── PlaceDetailModal.js    # Review submission + Firestore community reviews
├── android/
│   ├── build.gradle               # classpath com.google.gms:google-services:4.4.2
│   └── app/
│       ├── build.gradle           # apply plugin: com.google.gms.google-services
│       └── src/main/AndroidManifest.xml  # com.google.android.geo.API_KEY meta-data
└── assets/                        # icon, splash, adaptive icon variants
```

## Key Config Files (NOT committed — must be created manually)

- `.env` — `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=<key>`
- `android/app/google-services.json` — download from Firebase Console (halalroads-94454)

## Running the App

```bash
cd halalroads
JAVA_HOME="/c/Program Files/Java/jdk-17" PATH="/c/Program Files/Java/jdk-17/bin:$PATH" npx expo run:android
```

- **Must use JDK 17** — Java 25 breaks CMake builds
- Subsequent builds are fast (~1 min) via Gradle cache
- JS-only changes: Ctrl+M → Reload in emulator (no rebuild needed)
- Metro cache clear: `npx expo start --clear`

## Required Setup

1. Firebase Console → Authentication → Email/Password enabled
2. Google Cloud Console → **Maps SDK for Android** + **Places API** + **Directions API** all enabled
3. `android/app/google-services.json` present (download from Firebase Console)
4. `android/app/src/main/AndroidManifest.xml` has `com.google.android.geo.API_KEY` meta-data (hardcoded value, not from .env — react-native-maps reads it natively)
5. After adding `google-services.json` for the first time: delete `android/app/build` and `android/app/.cxx`, then rebuild

## Known Gotchas

- Use `@react-native-firebase` only — do NOT import from the `firebase` JS SDK (they conflict)
- `GooglePlacesAutocomplete` is a **named** export, not a default export
- Emulator GPS: use `getLastKnownPositionAsync()` first, fall back to `getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })`
- Maps API key must be in `AndroidManifest.xml` as native meta-data — `app.config.js` alone is not sufficient for `react-native-maps`
- Set mock location in emulator Extended Controls (...) → Location tab before launching the app

## Dependencies (key ones)

| Package | Version |
|---|---|
| `expo` | ~55.0.5 |
| `react-native` | 0.83.2 |
| `@react-native-firebase/app` | ^23.8.6 |
| `@react-native-firebase/auth` | ^23.8.6 |
| `@react-native-firebase/firestore` | ^23.8.6 |
| `react-native-maps` | 1.26.20 |
| `expo-location` | ~55.1.2 |
| `react-native-google-places-autocomplete` | ^2.6.4 |
| `@react-navigation/bottom-tabs` | ^7.x |
| `@react-navigation/native` | ^7.x |
| `@react-navigation/stack` | ^7.x |
