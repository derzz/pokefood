import React from 'react'
import { ImageSourcePropType, StyleSheet, Text, View } from 'react-native'
import { InlineIcon } from './icon'
import { AppColors } from '../lib/theme'

interface StatBarProps {
  label: string
  current: number
  max: number
  color?: string
  iconSrc?: ImageSourcePropType
  iconAlt?: string
  showMax?: boolean
}

export function StatBar({
  label,
  current,
  max,
  color = '#4169E1',
  iconSrc,
  iconAlt,
  showMax = true,
}: StatBarProps) {
  const percentage = Math.min(100, (current / Math.max(max, 1)) * 100)

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {iconSrc ? <InlineIcon src={iconSrc} alt={iconAlt ?? label} size="sm" /> : null}
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={styles.value}>{showMax ? `${current} / ${max}` : current}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelText: { fontSize: 11, color: AppColors.onSurface },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: AppColors.surfaceContainer,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 999 },
  value: { fontSize: 10, color: AppColors.onSurfaceVariant },
})
