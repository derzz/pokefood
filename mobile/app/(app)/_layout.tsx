import { Tabs } from 'expo-router'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useAppContext } from '../../context/AppContext'
import { AppColors } from '../../lib/theme'

function LogoutButton() {
  const { handleLogout } = useAppContext()
  return (
    <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
      <Text style={styles.logoutText}>Log out</Text>
    </TouchableOpacity>
  )
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: AppColors.surfaceContainer, borderTopColor: AppColors.outline },
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.onSurfaceVariant,
        headerStyle: { backgroundColor: AppColors.surfaceContainer },
        headerTintColor: AppColors.onSurface,
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Collection',
          tabBarLabel: 'Collection',
        }}
      />
      <Tabs.Screen
        name="battle"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  logoutBtn: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
  },
  logoutText: { color: AppColors.onSurface, fontSize: 11 },
})
