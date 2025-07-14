import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useLocation } from '../context/LocationContext';

export const LocationCheckScreen: React.FC = () => {
  const [pinCode, setPinCode] = useState('');
  const { setManualPinCode, checkPinCode, requestLocationPermission } = useLocation();

  const handlePinCodeSubmit = () => {
    if (!pinCode.trim()) {
      Alert.alert('Error', 'Please enter a pin code');
      return;
    }

    if (checkPinCode(pinCode)) {
      setManualPinCode(pinCode);
    } else {
      Alert.alert(
        'Service Unavailable',
        'Sorry, we do not deliver to this area yet. We currently serve selected areas in Bengaluru.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
        Service Area Check
      </Text>
      
      <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 32, textAlign: 'center' }}>
        We deliver to selected areas in Bengaluru. Please enter your pin code or allow location access.
      </Text>

      <TextInput
        style={{
          width: '100%',
          borderWidth: 1,
          borderColor: '#d1d5db',
          borderRadius: 8,
          padding: 16,
          fontSize: 16,
          marginBottom: 16
        }}
        placeholder="Enter pin code (e.g., 560001)"
        value={pinCode}
        onChangeText={setPinCode}
        keyboardType="numeric"
      />

      <TouchableOpacity
        style={{
          width: '100%',
          backgroundColor: '#ef4444',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}
        onPress={handlePinCodeSubmit}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Check Service Availability
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: '100%',
          backgroundColor: '#f3f4f6',
          padding: 16,
          borderRadius: 8
        }}
        onPress={requestLocationPermission}
      >
        <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Use Current Location
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: '#9ca3af', marginTop: 24, textAlign: 'center' }}>
        Currently serving: 560001, 560102, 560103, 560104, 560105
      </Text>
    </View>
  );
}; 