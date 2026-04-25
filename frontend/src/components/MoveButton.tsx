import React from 'react'
import type { Move } from '../types'

interface MoveButtonProps {
  move: Move
  onSelect: (move: Move) => void
  disabled?: boolean
  className?: string
}

export const MoveButton: React.FC<MoveButtonProps> = ({
  move,
  onSelect,
  disabled = false,
  className,
}) => {
  const mutatedIndicator = move.isMutated ? ' ✨' : ''

  return (
    <button
      className={`w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-surface-container-high)] px-3 py-3 text-left transition hover:border-[var(--color-primary)] hover:bg-[color-mix(in_oklab,var(--color-primary)_12%,var(--color-surface-container-high))] disabled:cursor-not-allowed disabled:opacity-40 ${className || ''}`}
      onClick={() => onSelect(move)}
      disabled={disabled}
      title={`Power: ${move.power}, Cost: ${move.mpCost} MP, Accuracy: ${move.accuracy}%`}
    >
      <div className="text-xs text-[var(--color-on-surface)] md:text-sm">{move.name}{mutatedIndicator}</div>
      <div className="mt-1 flex gap-3 text-[10px] text-[var(--color-on-surface-variant)] md:text-xs">
        <span>PWR {move.power}</span>
        <span>MP {move.mpCost}</span>
      </div>
    </button>
  )
}
