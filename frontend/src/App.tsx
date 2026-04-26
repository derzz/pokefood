import { useEffect, useRef, useState } from 'react'
import type { BattleMatchSession, Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from "./screens/RegisterScreen"
import {
  createBattleMatch,
  devLogin,
  getCurrentUserId,
  getUserCollection,
  isAuthenticated,
  login,
  logout, register,
  uploadFoodImage,
} from './api'

type AppScreen = 'home' | 'battle'

function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated())
  const [isRegistering, setIsRegistering] = useState(false)
  const [screen, setScreen] = useState<AppScreen>('home')
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [battleSession, setBattleSession] = useState<BattleMatchSession | null>(null)
  const [isMatchmaking, setIsMatchmaking] = useState(false)
  const matchRequestIdRef = useRef(0)
  const showDevLogin = import.meta.env.DEV

  useEffect(() => {
    if (!authenticated) {
      setCollection([])
      return
    }

    const loadCollection = async () => {
      try {
        const fetched = await getUserCollection(getCurrentUserId())
        setCollection(fetched)
      } catch (e) { console.error(e) }
    }
    void loadCollection()
  }, [authenticated])

  const handleLogin = async (e: string, p: string) => {
    await login(e, p)
    setAuthenticated(true)
  }

  const handleRegister = async (e: string, p: string) => {
    await register(e, p)
    await handleLogin(e, p)
    setIsRegistering(false)
  }

  const handleLogout = () => {
    matchRequestIdRef.current += 1
    setIsMatchmaking(false)
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
    if (isMatchmaking) {
      return
    }

    const requestId = matchRequestIdRef.current + 1
    matchRequestIdRef.current = requestId
    setIsMatchmaking(true)

    try {
      const match = await createBattleMatch()
      if (matchRequestIdRef.current !== requestId) {
        return
      }
      setSelectedPokefood(pokefood)
      setBattleSession(match)
      setScreen('battle')
    } catch (error) {
      if (matchRequestIdRef.current !== requestId) {
        return
      }
      console.error('Failed to start battle:', error)
    } finally {
      if (matchRequestIdRef.current === requestId) {
        setIsMatchmaking(false)
      }
    }
  }

  const handleExitBattle = () => {
    setScreen('home')
    setSelectedPokefood(null)
    setBattleSession(null)
  }

  if (!authenticated) {
    return isRegistering ? (
        <RegisterScreen onRegister={handleRegister} onBackToLogin={() => setIsRegistering(false)} />
    ) : (
        <LoginScreen
            onLogin={handleLogin}
            onDevLogin={async (e) => { await devLogin(e); setAuthenticated(true) }}
            showDevLogin={showDevLogin}
            onNavigateToRegister={() => setIsRegistering(true)}
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
        isMatchmaking={isMatchmaking}
      />
    </main>
  )
}

export default App
