import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { Rarity } from '../lib/types'

interface RarityBadgeProps {
  rarity: Rarity
}

const RARITY_COLORS: Record<Exclude<Rarity, 'Legendary'>, string> = {
  Common: '#9B9B9B',
  Rare: '#F97800',
  Epic: '#A020F0',
}

const RAINBOW = [
  '#FF0000', '#FF7700', '#FFFF00', '#00FF00',
  '#0000FF', '#8B00FF', '#FF00FF',
]

function getRainbowColors(offset: number): readonly [string, string, string, string] {
  const len = RAINBOW.length
  return [
    RAINBOW[offset % len],
    RAINBOW[(offset + 2) % len],
    RAINBOW[(offset + 4) % len],
    RAINBOW[(offset + 6) % len],
  ]
}

export function RarityBadge({ rarity }: RarityBadgeProps) {
  const [offset, setOffset] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (rarity !== 'Legendary') return
    intervalRef.current = setInterval(() => {
      setOffset((o) => (o + 1) % RAINBOW.length)
    }, 80)
    return () => {
      if (intervalRef.current !== null) clearInterval(intervalRef.current)
    }
  }, [rarity])

  if (rarity === 'Legendary') {
    return (
      <LinearGradient
        colors={getRainbowColors(offset)}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.badge}
      >
        <Text style={styles.legendaryText}>{rarity}</Text>
      </LinearGradient>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: RARITY_COLORS[rarity] }]}>
      <Text style={styles.text}>{rarity}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 10, color: 'rgba(0,0,0,0.9)' },
  legendaryText: { fontSize: 10, color: '#fff' },
})
