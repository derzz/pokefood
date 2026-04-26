import React from 'react'
import type { Rarity } from '../types'

interface RarityBadgeProps {
  rarity: Rarity
  className?: string
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, className }) => {
  const rarityColors: Record<Exclude<Rarity, 'Legendary'>, string> = {
    Common: '#9B9B9B',
    Rare: '#F97800',
    Epic: '#A020F0',
  }

  if (rarity === 'Legendary') {
    return (
      <span
        className={`rarity-legendary-bg inline-flex rounded-full px-2.5 py-1 text-[10px] text-white md:text-xs ${className || ''}`}
      >
        {rarity}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] text-black/90 md:text-xs ${className || ''}`}
      style={{ backgroundColor: rarityColors[rarity] }}
    >
      {rarity}
    </span>
  )
}
