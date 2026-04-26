import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import type { Pokefood } from '../lib/types'
import { FoodType } from '../lib/constants'

interface CollectionStatsProps {
  collection: Pokefood[]
  battlesWon: number
  battlesLost: number
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  )
}

export function CollectionStats({ collection, battlesWon, battlesLost }: CollectionStatsProps) {
  const total = collection.length
  const byRarity = {
    Common: collection.filter((p) => p.rarity === 'Common').length,
    Rare: collection.filter((p) => p.rarity === 'Rare').length,
    Epic: collection.filter((p) => p.rarity === 'Epic').length,
    Legendary: collection.filter((p) => p.rarity === 'Legendary').length,
  }
  const byType = {
    Meat: collection.filter((p) => p.type === FoodType.MEAT).length,
    Grains: collection.filter((p) => p.type === FoodType.GRAINS).length,
    'Fruits & Veg': collection.filter((p) => p.type === FoodType.FRUITS_VEGETABLES).length,
  }
  const strongest = total > 0 ? collection.reduce((a, b) => (b.atk > a.atk ? b : a)) : null
  const toughest = total > 0 ? collection.reduce((a, b) => (b.hp > a.hp ? b : a)) : null
  const collectionPower = collection.reduce((sum, p) => sum + p.atk, 0)
  const totalBattles = battlesWon + battlesLost
  const winRate = totalBattles > 0 ? Math.round((battlesWon / totalBattles) * 100) : 0

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stats</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} nestedScrollEnabled>
        <Section title="COLLECTION">
          <StatRow label="Total Cards" value={total} />
          <StatRow label="Collection Power" value={collectionPower} />
        </Section>
        <Section title="BY RARITY">
          <StatRow label="Common" value={byRarity.Common} />
          <StatRow label="Rare" value={byRarity.Rare} />
          <StatRow label="Epic" value={byRarity.Epic} />
          <StatRow label="Legendary" value={byRarity.Legendary} />
        </Section>
        <Section title="BY TYPE">
          <StatRow label="Meat" value={byType.Meat} />
          <StatRow label="Grains" value={byType.Grains} />
          <StatRow label="Fruits & Veg" value={byType['Fruits & Veg']} />
        </Section>
        <Section title="CHAMPIONS">
          <StatRow label="Strongest (ATK)" value={strongest?.name ?? '—'} />
          <StatRow label="Toughest (HP)" value={toughest?.name ?? '—'} />
        </Section>
        <Section title="BATTLE RECORD">
          <StatRow label="Won" value={battlesWon} />
          <StatRow label="Lost" value={battlesLost} />
          <StatRow label="Win Rate" value={totalBattles > 0 ? `${winRate}%` : '—'} />
        </Section>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0,0,0,0.4)',
    backgroundColor: 'rgba(245,240,232,0.7)',
    maxHeight: 256,
    overflow: 'hidden',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 12, color: '#000' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingVertical: 12, gap: 16 },
  section: { gap: 4 },
  sectionTitle: {
    fontSize: 9,
    color: 'rgba(0,0,0,0.5)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  statLabel: { fontSize: 10, color: 'rgba(0,0,0,0.7)' },
  statValue: { fontSize: 10, color: '#000' },
})
