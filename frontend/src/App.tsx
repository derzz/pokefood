import { useEffect, useRef, useState } from 'react'
import type { BattleMatchSession, Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from "./screens/RegisterScreen"
import {
  createBattleMatch,
  deletePokefood,
  devLogin,
  getCurrentUserId,
  getUserCollection,
  isAuthenticated,
  login,
  logout, register,
  uploadFoodImage,
} from './api'

function loadBattleRecord(userId: string) {
  return {
    won: parseInt(localStorage.getItem(`pokefood.${userId}.wins`) ?? '0', 10),
    lost: parseInt(localStorage.getItem(`pokefood.${userId}.losses`) ?? '0', 10),
  }
}

function saveBattleRecord(userId: string, won: number, lost: number) {
  localStorage.setItem(`pokefood.${userId}.wins`, String(won))
  localStorage.setItem(`pokefood.${userId}.losses`, String(lost))
}

type AppScreen = 'home' | 'battle'

function App() {
  const [authenticated, setAuthenticated] = useState(() => isAuthenticated())
  const [isRegistering, setIsRegistering] = useState(false)
  const [screen, setScreen] = useState<AppScreen>('home')
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [selectedPokefood, setSelectedPokefood] = useState<Pokefood | null>(null)
  const [battleSession, setBattleSession] = useState<BattleMatchSession | null>(null)
  const [isMatchmaking, setIsMatchmaking] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [battlesWon, setBattlesWon] = useState(0)
  const [battlesLost, setBattlesLost] = useState(0)
  const matchRequestIdRef = useRef(0)
  const showDevLogin = import.meta.env.DEV

  useEffect(() => {
    if (!authenticated) {
      setCollection([])
      setBattlesWon(0)
      setBattlesLost(0)
      return
    }

    const userId = getCurrentUserId()
    const record = loadBattleRecord(userId)
    setBattlesWon(record.won)
    setBattlesLost(record.lost)

    const loadCollection = async () => {
      try {
        const fetched = await getUserCollection(userId)
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

  const handleTransfer = async (pokefood: Pokefood) => {
    setIsTransferring(true)
    try {
      await deletePokefood(pokefood.id)
      setCollection((prev) => prev.filter((p) => p.id !== pokefood.id))
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setIsTransferring(false)
    }
  }

  const handleBattleResult = (result: 'win' | 'loss') => {
    const userId = getCurrentUserId()
    const current = loadBattleRecord(userId)
    const next = {
      won: current.won + (result === 'win' ? 1 : 0),
      lost: current.lost + (result === 'loss' ? 1 : 0),
    }
    saveBattleRecord(userId, next.won, next.lost)
    setBattlesWon(next.won)
    setBattlesLost(next.lost)
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
          onBattleResult={handleBattleResult}
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
        onTransfer={handleTransfer}
        isTransferring={isTransferring}
        battlesWon={battlesWon}
        battlesLost={battlesLost}
      />
    </main>
  )
}

export default App
