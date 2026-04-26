import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import type { Pokefood } from '../lib/types'
import { RarityBadge } from './rarity-badge'
import { InlineIcon } from './icon'
import { getTypeIcon } from '../lib/icons'
import { AppColors } from '../lib/theme'

interface PokefoodCardProps {
  pokefood: Pokefood
  onSelect: (pokefood: Pokefood) => void
}

const RARITY_BORDER: Record<string, string> = {
  Common: '#9B9B9B',
  Rare: '#F97800',
  Epic: '#A020F0',
}

const RAINBOW = [
  '#FF0000', '#FF7700', '#FFFF00', '#00FF00',
  '#0000FF', '#8B00FF', '#FF00FF',
]

export function PokefoodCard({ pokefood, onSelect }: PokefoodCardProps) {
  const typeIcon = getTypeIcon(pokefood.type)
  const isLegendary = pokefood.rarity === 'Legendary'
  const [borderColorIndex, setBorderColorIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!isLegendary) return
    intervalRef.current = setInterval(() => {
      setBorderColorIndex((i) => (i + 1) % RAINBOW.length)
    }, 80)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [isLegendary])

  const borderColor = isLegendary ? RAINBOW[borderColorIndex] : (RARITY_BORDER[pokefood.rarity] ?? '#938F99')

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor }]}
      onPress={() => onSelect(pokefood)}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: pokefood.pixelArtUrl ?? pokefood.imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{pokefood.name}</Text>
          {typeIcon ? (
            <InlineIcon src={typeIcon.src} alt={pokefood.type} size="md" />
          ) : null}
        </View>
        <RarityBadge rarity={pokefood.rarity} />
        <View style={styles.statsRow}>
          <Text style={styles.statText}>HP {pokefood.hp}</Text>
          <Text style={styles.statText}>ATK {pokefood.atk}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: AppColors.surfaceContainer,
    overflow: 'hidden',
  },
  imageContainer: {
    aspectRatio: 1,
    backgroundColor: AppColors.surfaceContainerHigh,
  },
  image: { width: '100%', height: '100%' },
  info: { padding: 12, gap: 8 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
    fontSize: 12,
    color: AppColors.onSurface,
    marginRight: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: AppColors.surfaceContainerHigh,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statText: { fontSize: 10, color: AppColors.onSurfaceVariant },
})
