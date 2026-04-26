import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native'

const sizeMap = { sm: 20, md: 24, lg: 32 } as const

interface IconProps {
  src: ImageSourcePropType
  alt?: string
  label?: string
  size?: keyof typeof sizeMap
  title?: string
}

export function Icon({ src, alt, label, size = 'md' }: IconProps) {
  const dim = sizeMap[size]
  return (
    <View style={styles.row}>
      <Image
        source={src}
        accessibilityLabel={alt}
        style={{ width: dim, height: dim }}
        resizeMode="contain"
      />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  )
}

interface InlineIconProps {
  src: ImageSourcePropType
  alt?: string
  size?: keyof typeof sizeMap
  title?: string
}

export function InlineIcon({ src, alt, size = 'sm' }: InlineIconProps) {
  const dim = sizeMap[size]
  return (
    <Image
      source={src}
      accessibilityLabel={alt}
      style={{ width: dim, height: dim }}
      resizeMode="contain"
    />
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 12 },
})
