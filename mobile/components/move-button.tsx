import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import * as Haptics from 'expo-haptics'
import type { Move } from '../lib/types'
import { AppColors } from '../lib/theme'

interface MoveButtonProps {
  move: Move
  onSelect: (move: Move) => void
  disabled?: boolean
}

export function MoveButton({ move, onSelect, disabled = false }: MoveButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(move)
  }

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={styles.name}>
        {move.name}{move.isMutated ? ' ✨' : ''}
      </Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>PWR {move.power}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainerHigh,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  disabled: { opacity: 0.4 },
  name: { fontSize: 12, color: AppColors.onSurface },
  stats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  stat: { fontSize: 10, color: AppColors.onSurfaceVariant },
})
