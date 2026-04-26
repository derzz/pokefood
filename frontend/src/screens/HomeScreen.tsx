import React, { useMemo, useState } from 'react'
import type { Pokefood } from '../types'
import { UploadZone } from '../components/UploadZone'
import { PokefoodGrid } from '../components/PokefoodGrid'
import { PokefoodDetail } from '../components/PokefoodDetail'
import { CollectionStats } from '../components/CollectionStats'

type SortKey = 'newest' | 'oldest' | 'rarity' | 'hp'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'rarity', label: 'Rarity' },
  { value: 'hp', label: 'HP' },
]

const RARITY_ORDER: Record<string, number> = { Legendary: 4, Epic: 3, Rare: 2, Common: 1 }

function sortPokefood(list: Pokefood[], key: SortKey): Pokefood[] {
  const copy = [...list]
  switch (key) {
    case 'newest':
      return copy.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    case 'oldest':
      return copy.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    case 'rarity':
      return copy.sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0))
    case 'hp':
      return copy.sort((a, b) => b.hp - a.hp)
  }
}

interface HomeScreenProps {
  pokefoodCollection: Pokefood[]
  onUploadStart: (file: File) => Promise<void>
  onNavigateToBattle?: (pokefood: Pokefood) => void | Promise<void>
  isMatchmaking?: boolean
  onTransfer?: (pokefood: Pokefood) => Promise<void>
  isTransferring?: boolean
  battlesWon?: number
  battlesLost?: number
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  pokefoodCollection,
  onUploadStart,
  onNavigateToBattle,
  isMatchmaking = false,
  onTransfer,
  isTransferring = false,
  battlesWon = 0,
  battlesLost = 0,
}) => {
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const sortedCollection = useMemo(() => sortPokefood(pokefoodCollection, sortKey), [pokefoodCollection, sortKey])

  const handleTransfer = async (pokefood: Pokefood) => {
    await onTransfer?.(pokefood)
    setSelectedPokefood(null)
  }

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
        <h1
          className="text-5xl text-black md:text-7xl"
          style={{ WebkitTextStroke: '3px white', paintOrder: 'stroke fill' }}
        >Pokefood</h1>
        <p className="text-xs text-black/70 md:text-sm">
          Collect delicious Pokefood from your meals
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <UploadZone onFileSelect={handleFileSelect} isLoading={isUploading} />
        <CollectionStats
          collection={pokefoodCollection}
          battlesWon={battlesWon}
          battlesLost={battlesLost}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
<div className="flex items-center gap-1 rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSortKey(opt.value)}
                className={`rounded-md px-3 py-1 text-xs transition md:text-sm ${
                  sortKey === opt.value
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <PokefoodGrid
          pokefood={sortedCollection}
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
          onTransfer={onTransfer ? handleTransfer : undefined}
          isTransferring={isTransferring}
        />
      )}
    </div>
  )
}
