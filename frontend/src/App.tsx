import { useEffect, useState } from 'react'
import type { BattleMatchSession, Pokefood } from './types'
import { HomeScreen } from './screens/HomeScreen'
import { BattleScreen } from './screens/BattleScreen'
import { LoginScreen } from './screens/LoginScreen'
import { RegisterScreen } from "./screens/RegisterScreen"
import {
  createBattleMatch, devLogin, getCurrentUserId,
  getUserCollection, login, logout, uploadFoodImage, register
} from './api'

type AppScreen = 'home' | 'battle'

function App() {
  const [authenticated, setAuthenticated] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
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
    logout(); setAuthenticated(false); setScreen('home');
    setSelectedPokefood(null); setBattleSession(null); setCollection([])
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

  return (
      <main className="min-h-screen bg-[var(--color-surface)] px-4 py-6 text-[var(--color-on-surface)] md:px-8">
        <div className="mx-auto mb-4 flex w-full max-w-7xl justify-end">
          <button onClick={handleLogout} className="rounded-lg border border-[var(--color-outline)] bg-[var(--color-surface-container)] px-3 py-2 text-xs md:text-sm transition hover:border-[var(--color-primary)]">
            Log out
          </button>
        </div>
        {screen === 'battle' && selectedPokefood && battleSession ? (
            <BattleScreen playerPokefood={selectedPokefood} matchSession={battleSession} onExit={() => { setScreen('home'); setSelectedPokefood(null); setBattleSession(null); }} />
        ) : (
            <HomeScreen
                pokefoodCollection={collection}
                onUploadStart={async (f) => { const n = await uploadFoodImage(f); setCollection(p => [...p, n]) }}
                onNavigateToBattle={async (p) => { const m = await createBattleMatch(); setSelectedPokefood(p); setBattleSession(m); setScreen('battle'); }}
            />
        )}
      </main>
  )
}

export default App
