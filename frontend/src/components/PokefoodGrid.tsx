import React from 'react'
import type { Pokefood } from '../types'
import { PokefoodCard } from './PokefoodCard'

interface PokefoodGridProps {
  pokefood: Pokefood[]
  onSelectPokefood: (pokefood: Pokefood) => void
  isLoading?: boolean
  className?: string
}

export const PokefoodGrid: React.FC<PokefoodGridProps> = ({
  pokefood,
  onSelectPokefood,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <div className={`rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-8 text-center text-sm text-[var(--color-on-surface-variant)] ${className || ''}`}>
        Loading your collection...
      </div>
    )
  }

  if (pokefood.length === 0) {
    return (
      <div className={`rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-8 text-center text-sm text-[var(--color-on-surface-variant)] ${className || ''}`}>
        <p>No Pokefood yet. Upload your first food photo!</p>
      </div>
    )
  }

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className || ''}`}>
      {pokefood.map((pf) => (
        <PokefoodCard
          key={pf.id}
          pokefood={pf}
          onSelect={onSelectPokefood}
        />
      ))}
    </div>
  )
}
