import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '@clerk/clerk-expo';
import { useLocation } from '../context/LocationContext';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { ProductDetailsScreen } from '../screens/ProductDetailsScreen';
import { LocationCheckScreen } from '../screens/LocationCheckScreen';
import { LoadingScreen } from '../screens/LoadingScreen';

const Stack = createStackNavigator();

export const RootNavigator: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const { isServiceAvailable, isLoading } = useLocation();

  if (!isLoaded || isLoading) {
    return <LoadingScreen />;
  }

  if (!isServiceAvailable) {
    return <LocationCheckScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}; 