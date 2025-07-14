import React from 'react';
import { View, Text } from 'react-native';

export const WishlistScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' }}>
        Your Wishlist
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
        Save your favorite items here for quick access
      </Text>
    </View>
  );
}; 