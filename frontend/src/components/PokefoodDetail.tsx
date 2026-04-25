import React from 'react'
import type { Pokefood } from '../types'
import { RarityBadge } from './RarityBadge'
import { StatBar } from './StatBar'

interface PokefoodDetailProps {
  pokefood: Pokefood
  onClose: () => void
  onBattle?: (pokefood: Pokefood) => void
  className?: string
}

export const PokefoodDetail: React.FC<PokefoodDetailProps> = ({
  pokefood,
  onClose,
  onBattle,
  className,
}) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ${className || ''}`}>
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-6 shadow-xl md:p-8">
      <button className="absolute right-3 top-3 h-9 w-9 rounded-md border border-[var(--color-outline)] text-lg text-[var(--color-on-surface-variant)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]" onClick={onClose}>
        ×
      </button>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="overflow-hidden rounded-xl bg-[var(--color-surface-container-high)]">
          <img
            src={pokefood.pixelArtUrl || pokefood.imageUrl}
            alt={pokefood.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="space-y-5">
          <h2 className="text-xl text-[var(--color-on-surface)] md:text-2xl">{pokefood.name}</h2>
          <RarityBadge rarity={pokefood.rarity} />

          <div className="space-y-3">
            <StatBar
              label="HP"
              current={pokefood.hp}
              max={100}
              color="#FF6B6B"
            />
            <StatBar
              label="ATK"
              current={pokefood.atk}
              max={100}
              color="#FFA500"
            />
          </div>

          <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
            <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Nutrition</h3>
            <ul className="space-y-1 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
              <li>Calories: {pokefood.nutritionInfo.calories}</li>
              <li>Fat: {pokefood.nutritionInfo.fat}g</li>
              <li>Protein: {pokefood.nutritionInfo.protein}g</li>
              <li>Carbs: {pokefood.nutritionInfo.carbs}g</li>
            </ul>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
            <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Moves</h3>
            <ul className="space-y-1 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
              {pokefood.moves.map((move) => (
                <li key={move.id}>
                  {move.name} ({move.type}) - PWR {move.power}
                </li>
              ))}
            </ul>
          </div>

          {onBattle && (
            <button className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs text-[var(--color-on-primary)] transition hover:brightness-110 md:text-sm" onClick={() => onBattle(pokefood)}>
              Battle
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
