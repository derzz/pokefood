import React from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

interface UploadZoneProps {
  onImagePicked: (base64: string) => void
  isLoading?: boolean
}

export function UploadZone({ onImagePicked, isLoading }: UploadZoneProps) {
  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow Pokefood to access your photos to upload food.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      base64: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0].base64) {
      onImagePicked(result.assets[0].base64)
    }
  }

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow Pokefood to access your camera to take food photos.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      base64: true,
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0].base64) {
      onImagePicked(result.assets[0].base64)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Food Photo</Text>
      <Text style={styles.subtitle}>
        Select a photo from your library or take a new one
      </Text>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#000" size="small" />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      ) : (
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.button} onPress={pickFromLibrary}>
            <Text style={styles.buttonText}>Choose Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={pickFromCamera}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.4)',
    backgroundColor: 'rgba(245,240,232,0.7)',
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  title: { fontSize: 16, color: '#000', fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 12, color: 'rgba(0,0,0,0.7)', textAlign: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  loadingText: { fontSize: 12, color: '#000' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: {
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cameraButton: { backgroundColor: 'rgba(0,0,0,0.15)' },
  buttonText: { fontSize: 12, color: '#000' },
})
