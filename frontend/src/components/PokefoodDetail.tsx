import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Pokefood } from '../types'
import { RarityBadge } from './RarityBadge'
import { StatBar } from './StatBar'
import { InlineIcon } from './Icon'
import { getNutritionIcon, getTypeIcon, getStatIcon } from '../utils/icons'

interface PokefoodDetailProps {
  pokefood: Pokefood
  onClose: () => void
  onBattle?: (pokefood: Pokefood) => void | Promise<void>
  isBattleLoading?: boolean
  onTransfer?: (pokefood: Pokefood) => Promise<void>
  isTransferring?: boolean
  className?: string
}

interface MoveNameMarqueeProps {
  name: string
}

const MoveNameMarquee: React.FC<MoveNameMarqueeProps> = ({ name }) => {
  const trackRef = useRef<HTMLSpanElement | null>(null)
  const textRef = useRef<HTMLSpanElement | null>(null)
  const [overflowDistance, setOverflowDistance] = useState(0)

  useEffect(() => {
    const computeOverflow = () => {
      if (!trackRef.current || !textRef.current) {
        return
      }
      const distance = Math.max(0, Math.ceil(textRef.current.scrollWidth - trackRef.current.clientWidth))
      setOverflowDistance(distance)
    }

    computeOverflow()
    window.addEventListener('resize', computeOverflow)

    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined' && trackRef.current) {
      observer = new ResizeObserver(computeOverflow)
      observer.observe(trackRef.current)
    }

    return () => {
      window.removeEventListener('resize', computeOverflow)
      if (observer) {
        observer.disconnect()
      }
    }
  }, [name])

  const durationSeconds = Math.min(10, Math.max(5, 3.5 + overflowDistance / 30))

  return (
    <span ref={trackRef} className="move-name-marquee-track">
      <span
        ref={textRef}
        className={`move-name-marquee text-[var(--color-on-surface)] ${overflowDistance > 0 ? 'move-name-marquee--animate' : ''}`}
        style={{
          ['--marquee-distance' as string]: `${overflowDistance}px`,
          ['--marquee-duration' as string]: `${durationSeconds}s`,
        }}
      >
        {name}
      </span>
    </span>
  )
}

export const PokefoodDetail: React.FC<PokefoodDetailProps> = ({
  pokefood,
  onClose,
  onBattle,
  isBattleLoading = false,
  onTransfer,
  isTransferring = false,
  className,
}) => {
  const [confirmingTransfer, setConfirmingTransfer] = useState(false)

  const handleConfirmTransfer = useCallback(async () => {
    await onTransfer?.(pokefood)
  }, [onTransfer, pokefood])

  const statScaleMax = Math.max(pokefood.hp, pokefood.atk, 1)
  const displayedTypeLabel =
    pokefood.type === 'fruits_vegetables'
      ? 'FRUIT/VEGETABLE'
      : pokefood.type === 'grains'
        ? 'GRAIN'
        : pokefood.type === 'meat'
          ? 'MEAT'
          : pokefood.type

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 ${className || ''}`}>
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-6 shadow-xl md:p-8">
      <button
        className="absolute right-3 top-3 h-9 w-9 rounded-md border border-[var(--color-outline)] text-lg text-[var(--color-on-surface-variant)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onClose}
        disabled={isBattleLoading || isTransferring}
      >
        ×
      </button>

      <div className="space-y-6">
        <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4 md:p-5">
          <div className="flex items-start gap-4 md:gap-5">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] md:h-24 md:w-24">
              <img
                src={pokefood.pixelArtUrl || pokefood.imageUrl}
                alt={pokefood.name}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="truncate text-xl text-[var(--color-on-surface)] md:text-2xl">{pokefood.name}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <RarityBadge rarity={pokefood.rarity} />
                <span className="rounded-md border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--color-on-surface-variant)] md:text-xs">
                  {displayedTypeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
            <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Core Stats</h3>
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
        </div>

        <div className="rounded-xl bg-[var(--color-surface-container-high)] p-4">
          <h3 className="mb-3 text-sm text-[var(--color-on-surface)]">Moves</h3>
          <ul className="grid gap-2 md:grid-cols-2">
            {pokefood.moves.map((move) => {
              const typeIcon = getTypeIcon(move.type.toLowerCase().replace(/\s+/g, '_'))
              return (
                <li key={move.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-3 py-2 text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    {typeIcon && (
                      <InlineIcon
                        src={typeIcon.src}
                        alt={move.type}
                        size="sm"
                      />
                    )}
                    <MoveNameMarquee name={move.name} />
                  </span>
                  <span className="flex-shrink-0 text-[var(--color-on-surface-variant)]">PWR {move.power}x</span>
                </li>
              )
            })}
          </ul>
        </div>

        {onBattle && (
          <button
            className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs text-[var(--color-on-primary)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-80 md:text-sm"
            onClick={() => void onBattle(pokefood)}
            disabled={isBattleLoading || isTransferring}
          >
            <span className="inline-flex items-center gap-2">
              {isBattleLoading && (
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              {isBattleLoading ? 'Finding match...' : 'Battle'}
            </span>
          </button>
        )}

        {onTransfer && (
          confirmingTransfer ? (
            <div className="space-y-3 rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] p-4">
              <p className="text-xs text-[var(--color-on-surface-variant)] md:text-sm">
                Transfer <span className="text-[var(--color-on-surface)]">{pokefood.name}</span>? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  className="flex-1 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-400 transition hover:bg-red-500/20 disabled:cursor-wait disabled:opacity-60 md:text-sm"
                  onClick={() => void handleConfirmTransfer()}
                  disabled={isTransferring}
                >
                  <span className="inline-flex items-center gap-2">
                    {isTransferring && (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                    {isTransferring ? 'Transferring...' : 'Confirm Transfer'}
                  </span>
                </button>
                <button
                  className="rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-4 py-2 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  onClick={() => setConfirmingTransfer(false)}
                  disabled={isTransferring}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-4 py-3 text-xs text-[var(--color-on-surface-variant)] transition hover:border-red-400/60 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              onClick={() => setConfirmingTransfer(true)}
              disabled={isBattleLoading || isTransferring}
            >
              Transfer
            </button>
          )
        )}
        </div>
      </div>
    </div>
  )
}
