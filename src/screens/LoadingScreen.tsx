import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export const LoadingScreen: React.FC = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <ActivityIndicator size="large" color="#ef4444" />
      <Text className="mt-4 text-lg text-gray-600">Loading...</Text>
    </View>
  );
}; 