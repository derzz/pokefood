import React from 'react'
import type { Pokefood } from '../types'
import { FoodType } from '../constants'
import { formatDisplayName } from '../utils/format'

interface CollectionStatsProps {
  collection: Pokefood[]
  battlesWon: number
  battlesLost: number
}

interface StatRowProps {
  label: string
  value: string | number
}

const StatRow: React.FC<StatRowProps> = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-[10px] text-black/70">{label}</span>
    <span className="text-[10px] text-black tabular-nums">{value}</span>
  </div>
)

export const CollectionStats: React.FC<CollectionStatsProps> = ({
  collection,
  battlesWon,
  battlesLost,
}) => {
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
    <div className="flex max-h-64 flex-col rounded-2xl border border-dashed border-black/40 bg-[#f5f0e8]/70">
      <div className="shrink-0 border-b border-black/20 px-6 py-4">
        <h2 className="text-sm text-black">Stats</h2>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto px-6 py-4 scrollbar-thin">{/* scrollable body */}

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-black/50">Collection</p>
        <StatRow label="Total Cards" value={total} />
        <StatRow label="Collection Power" value={collectionPower} />
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-black/50">By Rarity</p>
        <StatRow label="Common" value={byRarity.Common} />
        <StatRow label="Rare" value={byRarity.Rare} />
        <StatRow label="Epic" value={byRarity.Epic} />
        <StatRow label="Legendary" value={byRarity.Legendary} />
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-black/50">By Type</p>
        <StatRow label="Meat" value={byType.Meat} />
        <StatRow label="Grains" value={byType.Grains} />
        <StatRow label="Fruits & Veg" value={byType['Fruits & Veg']} />
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-black/50">Champions</p>
        <StatRow label="Strongest (ATK)" value={strongest ? formatDisplayName(strongest.name) : '—'} />
        <StatRow label="Toughest (HP)" value={toughest ? formatDisplayName(toughest.name) : '—'} />
      </div>

      <div className="space-y-1.5">
        <p className="text-[9px] uppercase tracking-widest text-black/50">Battle Record</p>
        <StatRow label="Won" value={battlesWon} />
        <StatRow label="Lost" value={battlesLost} />
        <StatRow label="Win Rate" value={totalBattles > 0 ? `${winRate}%` : '—'} />
      </div>
      </div>
    </div>
  )
}
