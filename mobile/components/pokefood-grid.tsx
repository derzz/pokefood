import React from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native'
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

  return (
    <FlatList
      data={pokefood}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <PokefoodCard pokefood={item} onSelect={onSelectPokefood} />
      )}
      scrollEnabled={false}
    />
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
  list: { gap: 8 },
  row: { gap: 8 },
})
