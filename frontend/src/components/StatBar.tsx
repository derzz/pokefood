import React from 'react'
import { InlineIcon } from './Icon'

interface StatBarProps {
  label: string
  current: number
  max: number
  color?: string
  className?: string
  iconSrc?: string
  iconAlt?: string
}

export const StatBar: React.FC<StatBarProps> = ({
  label,
  current,
  max,
  color = '#4169E1',
  className,
  iconSrc,
  iconAlt,
}) => {
  const percentage = Math.min(100, (current / max) * 100)

  return (
    <div className={`space-y-1 ${className || ''}`}>
      <div className="flex items-center gap-2">
        {iconSrc && <InlineIcon src={iconSrc} alt={iconAlt || label} size="sm" />}
        <label className="block text-[11px] text-[var(--color-on-surface)] md:text-xs">{label}</label>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-container)] md:h-3">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="inline-block text-[10px] text-[var(--color-on-surface-variant)] md:text-xs">
        {current} / {max}
      </span>
    </div>
  )
}
