import React from 'react'
import type { Pokefood } from '../types'
import { RarityBadge } from './RarityBadge'
import { InlineIcon } from './Icon'
import { getTypeIcon } from '../utils/icons'

interface PokefoodCardProps {
  pokefood: Pokefood
  onSelect: (pokefood: Pokefood) => void
  className?: string
}

export const PokefoodCard: React.FC<PokefoodCardProps> = ({
  pokefood,
  onSelect,
  className,
}) => {
  const typeIcon = getTypeIcon(pokefood.type.toLowerCase().replace(/\s+/g, '_'))

  return (
    <div
      className={`group overflow-hidden rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${className || ''}`}
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
          <h3 className="flex-1 text-sm text-[var(--color-on-surface)] md:text-base">{pokefood.name}</h3>
          {typeIcon && (
            <InlineIcon
              src={typeIcon.src}
              alt={pokefood.type}
              size="md"
              title={pokefood.type}
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
