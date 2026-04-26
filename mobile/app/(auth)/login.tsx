import React, { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useAppContext } from '../../context/AppContext'
import { AppColors } from '../../lib/theme'

export default function LoginScreen() {
  const { handleLogin } = useAppContext()
  const [email, setEmail] = useState('demo@pokefood.local')
  const [password, setPassword] = useState('password123')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      await handleLogin(email, password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Pokefood Login</Text>
          <Text style={styles.subtitle}>Sign in to create and view your Pokefoods.</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!isSubmitting}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isSubmitting}
            />

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.disabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              disabled={isSubmitting}
            >
              <Text style={styles.link}>Don't have an account? Register here</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: AppColors.surface },
  container: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    padding: 24,
  },
  title: {
    fontSize: 22,
    color: AppColors.onSurface,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
  },
  form: { marginTop: 24, gap: 12 },
  label: { fontSize: 12, color: AppColors.onSurface },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: AppColors.onSurface,
    fontSize: 14,
  },
  error: { fontSize: 12, color: AppColors.error },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: AppColors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: { color: AppColors.onPrimary, fontSize: 12 },
  disabled: { opacity: 0.6 },
  divider: {
    borderTopWidth: 1,
    borderTopColor: AppColors.outline,
    marginTop: 4,
  },
  link: { color: AppColors.primary, fontSize: 12, textAlign: 'center' },
})
