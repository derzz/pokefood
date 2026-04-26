import React from 'react'
import type { Pokefood } from '../types'
import { RarityBadge } from './RarityBadge'
import { InlineIcon } from './Icon'
import { getTypeIcon } from '../utils/icons'
import { formatDisplayName } from '../utils/format'

interface PokefoodCardProps {
  pokefood: Pokefood
  onSelect: (pokefood: Pokefood) => void
  className?: string
}

const RARITY_BORDER: Record<string, string> = {
  Common: '#9B9B9B',
  Rare: '#F97800',
  Epic: '#A020F0',
}

function getTypeTooltip(type: string): string {
  switch (type) {
    case 'meat':
      return 'Type: Meat'
    case 'grains':
      return 'Type: Grain'
    case 'fruits_vegetables':
      return 'Type: Fruit/Vegetable'
    default:
      return `Type: ${type}`
  }
}

export const PokefoodCard: React.FC<PokefoodCardProps> = ({
  pokefood,
  onSelect,
  className,
}) => {
  const typeIcon = getTypeIcon(pokefood.type.toLowerCase().replace(/\s+/g, '_'))
  const isLegendary = pokefood.rarity === 'Legendary'
  const borderColor = RARITY_BORDER[pokefood.rarity] ?? '#938F99'

  return (
    <div
      className={`group overflow-hidden rounded-2xl bg-[var(--color-surface-container)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${isLegendary ? 'rarity-legendary-border' : 'border-2'} ${className || ''}`}
      style={isLegendary ? undefined : { borderColor }}
      onClick={() => onSelect(pokefood)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onSelect(pokefood)
        }
      }}
    >
      <div className="aspect-square overflow-hidden bg-[var(--color-surface-container-high)]">
        <img
          src={pokefood.pixelArtUrl || pokefood.imageUrl}
          alt={pokefood.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="flex-1 text-sm text-[var(--color-on-surface)] md:text-base">{formatDisplayName(pokefood.name)}</h3>
          {typeIcon && (
            <InlineIcon
              src={typeIcon.src}
              alt={pokefood.type}
              size="md"
              title={getTypeTooltip(pokefood.type)}
              className="flex-shrink-0"
            />
          )}
        </div>
        <RarityBadge rarity={pokefood.rarity} />
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-[var(--color-surface-container-high)] px-3 py-2 text-center text-[11px] text-[var(--color-on-surface-variant)] md:text-xs">
          <span>HP {pokefood.hp}</span>
          <span>ATK {pokefood.atk}</span>
        </div>
      </div>
    </div>
  )
}
