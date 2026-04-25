import { useEffect, useState } from 'react'
import type { BattleMatchSession, Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { LoginScreen } from './screens/LoginScreen'
import {
  createBattleMatch,
  devLogin,
  getCurrentUserId,
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
  const [battleSession, setBattleSession] = useState<BattleMatchSession | null>(null)
  const showDevLogin = import.meta.env.DEV

  useEffect(() => {
    if (!authenticated) {
      setCollection([])
      return
    }

    const loadCollection = async () => {
      try {
        const userId = getCurrentUserId()
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
    setBattleSession(null)
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
      const match = await createBattleMatch()
      setSelectedPokefood(pokefood)
      setBattleSession(match)
      setScreen('battle')
    } catch (error) {
      console.error('Failed to start battle:', error)
    }
  }

  const handleExitBattle = () => {
    setScreen('home')
    setSelectedPokefood(null)
    setBattleSession(null)
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

  if (screen === 'battle' && selectedPokefood && battleSession) {
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
          matchSession={battleSession}
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
