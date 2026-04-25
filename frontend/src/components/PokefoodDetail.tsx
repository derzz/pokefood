import React from 'react'
import type { Pokefood } from '../types'
import { RarityBadge } from './RarityBadge'
import { StatBar } from './StatBar'
import { InlineIcon } from './Icon'
import { getNutritionIcon, getTypeIcon, getStatIcon } from '../utils/icons'

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
  const statScaleMax = Math.max(pokefood.hp, pokefood.atk, 1)

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
            {getStatIcon('hp') && (
              <StatBar
                label="HP"
                current={pokefood.hp}
                max={statScaleMax}
                color="#FF6B6B"
                iconSrc={getStatIcon('hp')!.src}
                iconAlt="Health Points"
                showMax={false}
              />
            )}
            {getStatIcon('atk') && (
              <StatBar
                label="ATK"
                current={pokefood.atk}
                max={statScaleMax}
                color="#FFA500"
                iconSrc={getStatIcon('atk')!.src}
                iconAlt="Attack Power"
                showMax={false}
              />
            )}
          </div>

          <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
            <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Nutrition</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                {getNutritionIcon('calories') && (
                  <InlineIcon
                    src={getNutritionIcon('calories')!.src}
                    alt="Calories"
                    size="sm"
                  />
                )}
                <span>Calories: <span className="text-[var(--color-on-surface)]">{pokefood.nutritionInfo.calories}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                {getNutritionIcon('protein') && (
                  <InlineIcon
                    src={getNutritionIcon('protein')!.src}
                    alt="Protein"
                    size="sm"
                  />
                )}
                <span>Protein: <span className="text-[var(--color-on-surface)]">{pokefood.nutritionInfo.protein}g</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                {getNutritionIcon('carbs') && (
                  <InlineIcon
                    src={getNutritionIcon('carbs')!.src}
                    alt="Carbs"
                    size="sm"
                  />
                )}
                <span>Carbs: <span className="text-[var(--color-on-surface)]">{pokefood.nutritionInfo.carbs}g</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                {getNutritionIcon('fat') && (
                  <InlineIcon
                    src={getNutritionIcon('fat')!.src}
                    alt="Fat"
                    size="sm"
                  />
                )}
                <span>Fat: <span className="text-[var(--color-on-surface)]">{pokefood.nutritionInfo.fat}g</span></span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
            <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Moves</h3>
            <ul className="space-y-2">
              {pokefood.moves.map((move) => {
                const typeIcon = getTypeIcon(move.type.toLowerCase().replace(/\s+/g, '_'))
                return (
                  <li key={move.id} className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                    {typeIcon && (
                      <InlineIcon
                        src={typeIcon.src}
                        alt={move.type}
                        size="sm"
                      />
                    )}
                    <span className="text-[var(--color-on-surface)]">{move.name}</span>
                    <span className="text-[var(--color-on-surface-variant)]">PWR {move.power}</span>
                  </li>
                )
              })}
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
