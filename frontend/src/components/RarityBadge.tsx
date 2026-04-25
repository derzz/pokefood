import React from 'react'
import type { Rarity } from '../types'

interface RarityBadgeProps {
  rarity: Rarity
  className?: string
}

export const RarityBadge: React.FC<RarityBadgeProps> = ({ rarity, className }) => {
  const rarityColors: Record<Rarity, string> = {
    Common: '#888888',
    Rare: '#4169E1',
    Epic: '#9932CC',
    Legendary: '#FFD700',
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
