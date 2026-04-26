import React, { useEffect, useState } from 'react'

const LOADING_PHRASES = [
  'Whisking up pixel flavor...',
  'Seasoning your snapshot...',
  'Simmering a flavor forecast...',
  'Plating a midnight special...',
  'Sprinkling extra crunch data...',
  'Caramelizing colors and textures...',
  'Shaking up a visual tasting menu...',
  'Reducing noise into rich aroma notes...',
  'Pairing patterns with perfect garnish...',
  'Roasting details to golden crisp...',
  'Folding ingredients into a fantasy feast...',
  'Mapping your meal to a chef\'s quest...'
]

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isLoading }) => {
  const [isDragActive, setIsDragActive] = useState(false)
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0)

  useEffect(() => {
    if (!isLoading) {
      setLoadingPhraseIndex(0)
      return
    }

    const intervalId = window.setInterval(() => {
      setLoadingPhraseIndex((prevIndex) => (prevIndex + 1) % LOADING_PHRASES.length)
    }, 1800)

    return () => window.clearInterval(intervalId)
  }, [isLoading])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition md:p-12 ${
        isDragActive
          ? 'border-black/60 bg-[#f5f0e8]/80'
          : 'border-black/40 bg-[#f5f0e8]/70'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={isLoading}
        style={{ display: 'none' }}
        id="file-input"
      />
      <label htmlFor="file-input" className="block w-full cursor-pointer">
        <div className="space-y-3">
          <h2 className="text-lg leading-tight text-black md:text-xl">Upload Food Photo</h2>
          <p className="text-xs leading-relaxed text-black/70 md:text-sm">
            Drag and drop your food image here or click to select
          </p>
          {isLoading && (
            <p className="text-xs text-black/70 md:text-sm">{LOADING_PHRASES[loadingPhraseIndex]}</p>
          )}
        </div>
      </label>
    </div>
  )
}
