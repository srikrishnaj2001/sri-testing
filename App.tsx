import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from 'react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

import { tokenCache } from './src/utils/tokenCache';
import { RootNavigator } from './src/navigation/RootNavigator';
import { LocationProvider } from './src/context/LocationContext';
import { CLERK_PUBLISHABLE_KEY } from './src/constants/config';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Fonts will be loaded later
        console.log('App prepared successfully');
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = React.useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ClerkProvider
        publishableKey={CLERK_PUBLISHABLE_KEY}
        tokenCache={tokenCache}
      >
        <QueryClientProvider client={queryClient}>
          <LocationProvider>
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
          </LocationProvider>
        </QueryClientProvider>
      </ClerkProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
} 