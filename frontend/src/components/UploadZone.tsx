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
          {isLoading && <p className="text-xs text-black md:text-sm">Processing...</p>}
        </div>
      </label>
    </div>
  )
}
