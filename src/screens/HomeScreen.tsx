import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export const HomeScreen: React.FC = () => {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' }}>
          Welcome to eFood
        </Text>
        
        <Text style={{ fontSize: 16, color: '#6b7280', marginBottom: 24 }}>
          10-minute food delivery from your favorite cloud kitchen in Bengaluru
        </Text>

        <View style={{ backgroundColor: '#fef2f2', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#ef4444', marginBottom: 8 }}>
            🚀 Lightning Fast Delivery
          </Text>
          <Text style={{ color: '#7f1d1d' }}>
            Get your favorite food delivered in just 10 minutes!
          </Text>
        </View>

        <View style={{ backgroundColor: '#f0f9ff', padding: 16, borderRadius: 8, marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#0ea5e9', marginBottom: 8 }}>
            📍 Service Areas
          </Text>
          <Text style={{ color: '#0c4a6e' }}>
            Currently serving pin codes: 560001, 560102, 560103, 560104, 560105
          </Text>
        </View>

        <View style={{ backgroundColor: '#f0fdf4', padding: 16, borderRadius: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#22c55e', marginBottom: 8 }}>
            🍕 Fresh Food
          </Text>
          <Text style={{ color: '#14532d' }}>
            Made fresh in our cloud kitchen with the finest ingredients
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}; 