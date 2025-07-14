import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { ALLOWED_PIN_CODES } from '../constants/config';

interface LocationContextType {
  location: Location.LocationObject | null;
  address: string | null;
  pinCode: string | null;
  isServiceAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<void>;
  checkPinCode: (pinCode: string) => boolean;
  setManualPinCode: (pinCode: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [pinCode, setPinCode] = useState<string | null>(null);
  const [isServiceAvailable, setIsServiceAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPinCode = (code: string): boolean => {
    return ALLOWED_PIN_CODES.includes(code);
  };

  const setManualPinCode = (code: string) => {
    setPinCode(code);
    setIsServiceAvailable(checkPinCode(code));
  };

  const requestLocationPermission = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Location permission is required for delivery service');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to use our delivery service',
          [{ text: 'OK' }]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Reverse geocoding to get address
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (addressResult && addressResult.length > 0) {
        const addressInfo = addressResult[0];
        const fullAddress = `${addressInfo.street}, ${addressInfo.city}, ${addressInfo.region}`;
        setAddress(fullAddress);
        
        if (addressInfo.postalCode) {
          setPinCode(addressInfo.postalCode);
          setIsServiceAvailable(checkPinCode(addressInfo.postalCode));
        }
      }
    } catch (err) {
      setError('Failed to get location. Please try again.');
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const value: LocationContextType = {
    location,
    address,
    pinCode,
    isServiceAvailable,
    isLoading,
    error,
    requestLocationPermission,
    checkPinCode,
    setManualPinCode,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}; 