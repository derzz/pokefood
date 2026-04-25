import { useState } from 'react'
import type { Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'

type AppScreen = 'home' | 'battle'

function App() {
  const [screen, setScreen] = useState<AppScreen>('home')
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [opponentPokefood, setOpponentPokefood] = useState<Pokefood | null>(null)

  // Simulated user ID - replace with actual auth
  const userId = 'demo-user-123'

  const handleUploadStart = async (file: File) => {
    try {
      // For now, simulate the upload. Replace with actual API call:
      // const newPokefood = await uploadFoodImage(file)
      
      // Simulated response
      const newPokefood: Pokefood = {
        id: Date.now().toString(),
        name: 'New Pokefood',
        imageUrl: URL.createObjectURL(file),
        type: 'Fruit',
        variant: 'Normal',
        rarity: 'Common',
        hp: 45,
        atk: 49,
        mp: 45,
        moves: [],
        nutritionInfo: {
          calories: 100,
          fat: 0.3,
          protein: 1,
          carbs: 25,
        },
        createdAt: new Date(),
        uploadedBy: userId,
      }

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
