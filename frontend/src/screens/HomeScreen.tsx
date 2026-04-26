import React, { useState } from 'react'
import type { Pokefood } from '../types'
import { UploadZone } from '../components/UploadZone'
import { PokefoodGrid } from '../components/PokefoodGrid'
import { PokefoodDetail } from '../components/PokefoodDetail'

interface HomeScreenProps {
  pokefoodCollection: Pokefood[]
  onUploadStart: (file: File) => Promise<void>
  onNavigateToBattle?: (pokefood: Pokefood) => void | Promise<void>
  isMatchmaking?: boolean
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pokefoodCollection,
  onUploadStart,
  onNavigateToBattle,
  isMatchmaking = false,
}) => {
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = async (file: File) => {
    setIsUploading(true)
    try {
      await onUploadStart(file)
    } finally {
      setIsUploading(false)
    }
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
          isBattleLoading={isMatchmaking}
        />
      )}
    </div>
  )
}
