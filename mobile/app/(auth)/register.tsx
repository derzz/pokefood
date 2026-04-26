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

export default function RegisterScreen() {
  const { handleRegister } = useAppContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async () => {
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      await handleRegister(email, password)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed')
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Pokefood to start your collection.</Text>

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
                {isSubmitting ? 'Creating account...' : 'Register'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} disabled={isSubmitting}>
              <Text style={styles.link}>Already have an account? Sign in</Text>
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
  link: { color: AppColors.primary, fontSize: 12, textAlign: 'center' },
})
