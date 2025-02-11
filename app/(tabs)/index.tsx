import { StyleSheet, View, Text, TouchableOpacity, Button } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useEffect, useState, useRef } from 'react';
import * as Location from 'expo-location';
import Geolocation from '@react-native-community/geolocation';
import { FontAwesome } from '@expo/vector-icons';

// Default region set to Ukraine (Kyiv)
const DEFAULT_REGION: Region = {
  latitude: 50.4501,
  longitude: 30.5234,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MIN_ZOOM_DELTA = 0.01;
const MAX_ZOOM_DELTA = 1.5;

type LocationProvider = 'expo' | 'react-native';

export default function HomePage() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [provider, setProvider] = useState<LocationProvider>('react-native-community');
  const mapRef = useRef<MapView | null>(null);

  const getExpoLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      console.log('Getting location with Expo...');
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('Location received:', currentLocation);
      
      const newRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setLocation(currentLocation);
      setRegion(newRegion);
      
      // Add a small delay before animating to ensure the map is ready
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 500);
    } catch (error) {
      setErrorMsg('Error getting location');
      console.error('Location error:', error);
    }
  };

  const zoomIn = () => {
    if (region.latitudeDelta > MIN_ZOOM_DELTA) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 200);
    }
  };

  const zoomOut = () => {
    if (region.latitudeDelta < MAX_ZOOM_DELTA) {
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 200);
    }
  };

  const getRNLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.requestAuthorization();
      
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('Getting location with React Native Geolocation...');
          resolve({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              altitude: position.coords.altitude,
              accuracy: position.coords.accuracy,
              altitudeAccuracy: position.coords.altitudeAccuracy,
              heading: position.coords.heading,
              speed: position.coords.speed,
            },
            timestamp: position.timestamp,
          });
        },
        (error) => {
          reject(error);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  const getLocation = async () => {
    try {
      const currentLocation = await (provider === 'expo' ? getExpoLocation() : getRNLocation());
      if (!currentLocation) return;

      const newRegion: Region = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setLocation(currentLocation as any);
      setRegion(newRegion);
      
      setTimeout(() => {
        mapRef.current?.animateToRegion(newRegion, 1000);
      }, 100);
    } catch (error) {
      console.error('Error getting location:', error);
      setErrorMsg('Error getting location');
    }
  };

  const toggleProvider = () => {
    setProvider(prev => prev === 'expo' ? 'react-native-community' : 'expo');
  };

  useEffect(() => {
    getLocation();
  }, [provider]);

  return (
    <View style={styles.container}>
      {errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <View style={styles.mapContainer}>
          <TouchableOpacity onPress={toggleProvider} style={styles.providerStatus}>
            <Text style={styles.providerStatusText}>
              Provider: <Text style={styles.providerStatusValue}>{provider.toUpperCase()}</Text>
            </Text>
          </TouchableOpacity>

          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            region={region}
            showsUserLocation
            showsMyLocationButton
            showsScale
            showsCompass
            userLocationPriority="balanced"
            userLocationUpdateInterval={5000}
            followsUserLocation
            onRegionChangeComplete={setRegion}
          >
            {location && (
              <Marker
                coordinate={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                }}
                title="Your Location"
                description="You are here"
              />
            )}
          </MapView>
          
          <View style={styles.zoomControls}>
            <TouchableOpacity 
              style={styles.zoomButton} 
              onPress={zoomIn}
              disabled={region.latitudeDelta <= MIN_ZOOM_DELTA}
            >
              <FontAwesome name="plus" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.zoomButton} 
              onPress={zoomOut}
              disabled={region.latitudeDelta >= MAX_ZOOM_DELTA}
            >
              <FontAwesome name="minus" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={[styles.controlButton, styles.locationButton]}
              onPress={getLocation}
            >
              <FontAwesome name="location-arrow" size={24} color="white" />
            </TouchableOpacity>    
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  providerStatus: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  providerStatusText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
  providerStatusValue: {
    fontWeight: 'bold',
    color: '#34C759',
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationButton: {
    backgroundColor: '#007AFF',
  },
  providerButton: {
    backgroundColor: '#34C759',
  },
  providerText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  error: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'red',
    padding: 20,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 160,
    backgroundColor: 'transparent',
  },
  zoomButton: {
    width: 44,
    height: 44,
    backgroundColor: 'white',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
