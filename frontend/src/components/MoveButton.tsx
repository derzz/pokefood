import React from 'react'
import type { Move } from '../types'
import {getTypeIcon} from "../utils/icons.ts";
import {InlineIcon} from "./Icon.tsx";

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
      title={`Power: ${move.power}, Accuracy: ${move.accuracy}%`}
    >
      <div className="flex items-center gap-3">
        {/* Type Icons added to the left */}
        <span className="flex flex-shrink-0 gap-1">
          {(move.effectiveType ?? []).map((type, index) => {
            const typeIcon = getTypeIcon(type.toLowerCase().replace(/\s+/g, '_'));
            return typeIcon ? (
              <InlineIcon
                key={index}
                src={typeIcon.src}
                alt={type}
                size="sm"
              />
            ) : null;
          })}
        </span>

        {/* Move details */}
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--color-on-surface)] md:text-sm truncate">
            {move.name}{mutatedIndicator}
          </div>
          <div className="mt-1 flex gap-3 text-[10px] text-[var(--color-on-surface-variant)] md:text-xs">
            <span>PWR {move.power}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
