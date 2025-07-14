import React from 'react';
import { View, Text } from 'react-native';

export const CartScreen: React.FC = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' }}>
        Your Cart
      </Text>
      <Text style={{ fontSize: 16, color: '#6b7280', textAlign: 'center' }}>
        Your cart is empty. Add some delicious items from our menu!
      </Text>
    </View>
  );
}; 