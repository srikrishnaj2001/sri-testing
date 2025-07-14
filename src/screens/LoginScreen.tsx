import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@clerk/clerk-expo';

export const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();

  const handleLogin = async () => {
    // For now, just show that login is working
    console.log('Login button pressed');
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'white' }}>
      <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#ef4444' }}>
        eFood
      </Text>
      
      <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 48, textAlign: 'center' }}>
        10-minute food delivery from your favorite cloud kitchen
      </Text>

      <TouchableOpacity
        style={{
          width: '100%',
          backgroundColor: '#ef4444',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Continue with Phone
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          width: '100%',
          backgroundColor: '#f3f4f6',
          padding: 16,
          borderRadius: 8,
          marginBottom: 16
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: '#374151', fontSize: 16, fontWeight: '600', textAlign: 'center' }}>
          Continue with Email
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', marginTop: 24 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}; 