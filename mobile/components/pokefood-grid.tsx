import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import type { Pokefood } from '../lib/types'
import { PokefoodCard } from './pokefood-card'
import { AppColors } from '../lib/theme'

interface PokefoodGridProps {
  pokefood: Pokefood[]
  onSelectPokefood: (pokefood: Pokefood) => void
  isLoading?: boolean
}

export function PokefoodGrid({ pokefood, onSelectPokefood, isLoading = false }: PokefoodGridProps) {
  if (isLoading) {
    return (
      <View style={styles.empty}>
        <ActivityIndicator color={AppColors.primary} />
        <Text style={styles.emptyText}>Loading your collection...</Text>
      </View>
    )
  }

  if (pokefood.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No Pokefood yet. Upload your first food photo!</Text>
      </View>
    )
  }

  const rows: Pokefood[][] = []
  for (let i = 0; i < pokefood.length; i += 2) {
    rows.push(pokefood.slice(i, i + 2))
  }

  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => (
            <PokefoodCard key={item.id} pokefood={item} onSelect={onSelectPokefood} />
          ))}
          {row.length === 1 && <View style={styles.placeholder} />}
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 12,
    color: AppColors.onSurfaceVariant,
    textAlign: 'center',
  },
  grid: { gap: 6 },
  row: { flexDirection: 'row', gap: 6 },
  placeholder: { flex: 1 },
})
