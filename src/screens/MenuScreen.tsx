import React from 'react';
import { View, Text } from 'react-native';

export const MenuScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' }}>
        Menu
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
        Browse our delicious menu and add items to your cart
      </Text>
    </View>
  );
}; 