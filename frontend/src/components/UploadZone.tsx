import React, { useState } from 'react'

interface UploadZoneProps {
  onFileSelect: (file: File) => void
  isLoading?: boolean
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect, isLoading }) => {
  const [isDragActive, setIsDragActive] = useState(false)

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
          ? 'border-[var(--color-primary)] bg-[color-mix(in_oklab,var(--color-primary)_20%,transparent)]'
          : 'border-[var(--color-outline)] bg-[var(--color-surface-container)]'
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
          <h2 className="text-lg leading-tight text-[var(--color-on-surface)] md:text-xl">Upload Food Photo</h2>
          <p className="text-xs leading-relaxed text-[var(--color-on-surface-variant)] md:text-sm">
            Drag and drop your food image here or click to select
          </p>
          {isLoading && <p className="text-xs text-[var(--color-primary)] md:text-sm">Processing...</p>}
        </div>
      </label>
    </div>
  )
}
