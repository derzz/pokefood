import { Redirect, Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { AppProvider, useAppContext } from '../context/AppContext'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const { isAuthenticated, isLoading } = useAppContext()

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync()
    }
  }, [isLoading])

  if (isLoading) return null

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      {isAuthenticated ? (
        <Redirect href="/(app)" />
      ) : (
        <Redirect href="/(auth)/login" />
      )}
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <RootNavigator />
        <StatusBar style="light" />
      </AppProvider>
    </GestureHandlerRootView>
  )
}
