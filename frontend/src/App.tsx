import { useEffect, useState } from 'react'
import type { Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { LoginScreen } from './screens/LoginScreen'
import {
  devLogin,
  getUserCollection,
  isAuthenticated,
  login,
  logout,
  uploadFoodImage,
} from './api'

type AppScreen = 'home' | 'battle'

function App() {
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [screen, setScreen] = useState<AppScreen>('home')
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [opponentPokefood, setOpponentPokefood] = useState<Pokefood | null>(null)
  const showDevLogin = import.meta.env.DEV

  const userId = 'demo-user-123'

  useEffect(() => {
    if (!authenticated) {
      setCollection([])
      return
    }

    const loadCollection = async () => {
      try {
        const fetched = await getUserCollection(userId)
        setCollection(fetched)
      } catch (error) {
        console.error('Failed to load collection:', error)
      }
    }

    void loadCollection()
  }, [authenticated])

  const handleLogin = async (email: string, password: string) => {
    await login(email, password)
    setAuthenticated(true)
  }

  const handleDevLogin = async (email: string) => {
    await devLogin(email)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    logout()
    setAuthenticated(false)
    setScreen('home')
    setSelectedPokefood(null)
    setOpponentPokefood(null)
    setCollection([])
  }

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

  if (!authenticated) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onDevLogin={handleDevLogin}
        showDevLogin={showDevLogin}
      />
    )
  }

  if (screen === 'battle' && selectedPokefood && opponentPokefood) {
    return (
      <main className="min-h-screen bg-[var(--color-surface)] px-4 py-6 text-[var(--color-on-surface)] md:px-8">
        <div className="mx-auto mb-4 flex w-full max-w-6xl justify-end">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-3 py-2 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] md:text-sm"
          >
            Log out
          </button>
        </div>
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
      <div className="mx-auto mb-4 flex w-full max-w-7xl justify-end">
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-3 py-2 text-xs text-[var(--color-on-surface)] transition hover:border-[var(--color-primary)] md:text-sm"
        >
          Log out
        </button>
      </div>
      <HomeScreen
        pokefoodCollection={collection}
        onUploadStart={handleUploadStart}
        onNavigateToBattle={handleNavigateToBattle}
      />
    </main>
  )
}

export default App
