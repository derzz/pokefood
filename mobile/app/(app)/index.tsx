import React, { useMemo, useState } from 'react'
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAppContext } from '../../context/AppContext'
import { UploadZone } from '../../components/upload-zone'
import { CollectionStats } from '../../components/collection-stats'
import { PokefoodGrid } from '../../components/pokefood-grid'
import { PokefoodDetail } from '../../components/pokefood-detail'
import type { Pokefood } from '../../lib/types'
import { AppColors } from '../../lib/theme'

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

export default function HomeScreen() {
  const {
    collection,
    battlesWon,
    battlesLost,
    isMatchmaking,
    isTransferring,
    handleUpload,
    handleNavigateToBattle,
    handleTransfer,
  } = useAppContext()

  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('newest')

  const sortedCollection = useMemo(() => sortPokefood(collection, sortKey), [collection, sortKey])

  const handleImagePicked = async (base64: string) => {
    setIsUploading(true)
    try {
      await handleUpload(base64)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDetailTransfer = async (pokefood: Pokefood) => {
    await handleTransfer(pokefood)
    setSelectedPokefood(null)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pokefood</Text>
          <Text style={styles.subtitle}>Collect delicious Pokefood from your meals</Text>
        </View>

        {/* Upload + Stats */}
        <View style={styles.topSection}>
          <UploadZone onImagePicked={handleImagePicked} isLoading={isUploading} />
          <CollectionStats
            collection={collection}
            battlesWon={battlesWon}
            battlesLost={battlesLost}
          />
        </View>

        {/* Sort controls */}
        <View style={styles.sortRow}>
          <View style={styles.sortBar}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.sortBtn,
                  sortKey === opt.value && styles.sortBtnActive,
                ]}
                onPress={() => setSortKey(opt.value)}
              >
                <Text
                  style={[
                    styles.sortBtnText,
                    sortKey === opt.value && styles.sortBtnTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Grid */}
        <PokefoodGrid
          pokefood={sortedCollection}
          onSelectPokefood={setSelectedPokefood}
        />
      </ScrollView>

      {/* Detail modal */}
      <PokefoodDetail
        visible={selectedPokefood !== null}
        pokefood={selectedPokefood ?? collection[0] ?? PLACEHOLDER_POKEFOOD}
        onClose={() => setSelectedPokefood(null)}
        onBattle={handleNavigateToBattle}
        isBattleLoading={isMatchmaking}
        onTransfer={handleDetailTransfer}
        isTransferring={isTransferring}
      />
    </SafeAreaView>
  )
}

const PLACEHOLDER_POKEFOOD: Pokefood = {
  id: '',
  name: '',
  imageUrl: '',
  type: 'meat' as any,
  variant: 'Normal',
  rarity: 'Common',
  hp: 1,
  atk: 1,
  mp: 1,
  moves: [],
  nutritionInfo: { calories: 0, fat: 0, protein: 0, carbs: 0 },
  createdAt: new Date(),
  uploadedBy: '',
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: AppColors.surface },
  container: { padding: 16, gap: 20, paddingBottom: 40 },
  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 28, color: AppColors.onSurface, fontWeight: 'bold' },
  subtitle: { fontSize: 11, color: AppColors.onSurfaceVariant, textAlign: 'center' },
  topSection: { gap: 16 },
  sortRow: { flexDirection: 'row' },
  sortBar: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: AppColors.outline,
    backgroundColor: AppColors.surfaceContainer,
    padding: 4,
    gap: 2,
  },
  sortBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  sortBtnActive: { backgroundColor: AppColors.primary },
  sortBtnText: { fontSize: 11, color: AppColors.onSurfaceVariant },
  sortBtnTextActive: { color: AppColors.onPrimary },
})
