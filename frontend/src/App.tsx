import { useEffect, useState } from 'react'
import type { Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { getUserCollection, uploadFoodImage } from './api'

type AppScreen = 'home' | 'battle'

function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [opponentPokefood, setOpponentPokefood] = useState<Pokefood | null>(null)

  const userId = 'demo-user-123'

  useEffect(() => {
    const loadCollection = async () => {
      try {
        const fetched = await getUserCollection(userId)
        setCollection(fetched)
      } catch (error) {
        console.error('Failed to load collection:', error)
      }
    }

    void loadCollection()
  }, [])

  const handleUploadStart = async (file: File) => {
    try {
      const newPokefood = await uploadFoodImage(file)

      setCollection((prev) => [...prev, newPokefood])
    } catch (error) {
      console.error('Upload failed:', error)
    }
  }

  const handleNavigateToBattle = async (pokefood: Pokefood) => {
    try {
      setSelectedPokefood(pokefood)

      // For now, pick a random opponent from collection
      // Replace with actual API: const opponent = await getRandomOpponent()
      const opponent =
        collection.find((p) => p.id !== pokefood.id) || collection[0]

      if (!opponent) {
        alert('You need at least 2 Pokefood to battle!')
        return
      }

      setOpponentPokefood(opponent)
      setScreen('battle')
    } catch (error) {
      console.error('Failed to start battle:', error)
    }
  }

  const handleExitBattle = () => {
    setScreen('home')
    setSelectedPokefood(null)
    setOpponentPokefood(null)
  }

  if (screen === 'battle' && selectedPokefood && opponentPokefood) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] px-4 py-6 text-[var(--color-on-surface)] md:px-8">
        <BattleScreen
          playerPokefood={selectedPokefood}
          opponentPokefood={opponentPokefood}
          onExit={handleExitBattle}
        />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[var(--color-surface)] px-4 py-6 text-[var(--color-on-surface)] md:px-8">
      <HomeScreen
        pokefoodCollection={collection}
        onUploadStart={handleUploadStart}
        onNavigateToBattle={handleNavigateToBattle}
      />
    </main>
  )
}

export default App
