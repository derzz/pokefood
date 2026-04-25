import React from 'react'

interface IconProps {
  src: string
  alt: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
} as const

export const Icon: React.FC<IconProps> = ({
  src,
  alt,
  label,
  size = 'md',
  className = '',
  title
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} title={title}>
      <img
        src={src}
        alt={alt}
        className={`${sizeMap[size]} flex-shrink-0 object-contain`}
      />
      {label && <span className="text-xs md:text-sm">{label}</span>}
    </div>
  )
}

interface InlineIconProps {
  src: string
  alt: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  title?: string
}

export const InlineIcon: React.FC<InlineIconProps> = ({
  src,
  alt,
  size = 'sm',
  className = '',
  title
}) => {
  return (
    <img
      src={src}
      alt={alt}
      title={title}
      className={`${sizeMap[size]} inline-block flex-shrink-0 object-contain ${className}`}
    />
  )
}
