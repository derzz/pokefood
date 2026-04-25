import React, { useState } from 'react'
import type { Pokefood } from '../types'
import { UploadZone } from '../components/UploadZone'
import { PokefoodGrid } from '../components/PokefoodGrid'
import { PokefoodDetail } from '../components/PokefoodDetail'

interface HomeScreenProps {
  pokefoodCollection: Pokefood[]
  onUploadStart: (file: File) => void
  onNavigateToBattle?: (pokefood: Pokefood) => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pokefoodCollection,
  onUploadStart,
  onNavigateToBattle,
}) => {
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = (file: File) => {
    setIsUploading(true)
    onUploadStart(file)
    // Reset after simulated upload
    setTimeout(() => setIsUploading(false), 2000)
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <header className="space-y-3 text-center">
        <h1 className="text-3xl text-[var(--color-on-surface)] md:text-5xl">Pokefood</h1>
        <p className="text-xs text-[var(--color-on-surface-variant)] md:text-sm">
          Collect delicious Pokefood from your meals
        </p>
      </header>

      <section>
        <UploadZone onFileSelect={handleFileSelect} isLoading={isUploading} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg text-[var(--color-on-surface)] md:text-xl">Your Collection</h2>
        <PokefoodGrid
          pokefood={pokefoodCollection}
          onSelectPokefood={setSelectedPokefood}
          isLoading={false}
        />
      </section>

      {selectedPokefood && (
        <PokefoodDetail
          pokefood={selectedPokefood}
          onClose={() => setSelectedPokefood(null)}
          onBattle={onNavigateToBattle}
        />
      )}
    </div>
  )
}
