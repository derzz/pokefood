import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import type { BattleMatchSession, Pokefood } from '../lib/types'
import {
  createBattleMatch,
  deletePokefood,
  getCurrentUserId,
  getUserCollection,
  isAuthenticated,
  login,
  logout,
  register,
  uploadFoodImage,
} from '../lib/api'

interface AppContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  collection: Pokefood[]
  battlesWon: number
  battlesLost: number
  isMatchmaking: boolean
  isTransferring: boolean
  handleLogin: (email: string, password: string) => Promise<void>
  handleRegister: (email: string, password: string) => Promise<void>
  handleLogout: () => Promise<void>
  handleUpload: (base64: string) => Promise<void>
  handleNavigateToBattle: (pokefood: Pokefood) => Promise<void>
  handleTransfer: (pokefood: Pokefood) => Promise<void>
  handleBattleResult: (result: 'win' | 'loss') => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

async function loadBattleRecord(userId: string) {
  const [winsStr, lossesStr] = await Promise.all([
    AsyncStorage.getItem(`pokefood.${userId}.wins`),
    AsyncStorage.getItem(`pokefood.${userId}.losses`),
  ])
  return {
    won: parseInt(winsStr ?? '0', 10),
    lost: parseInt(lossesStr ?? '0', 10),
  }
}

async function saveBattleRecord(userId: string, won: number, lost: number) {
  await AsyncStorage.multiSet([
    [`pokefood.${userId}.wins`, String(won)],
    [`pokefood.${userId}.losses`, String(lost)],
  ])
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [collection, setCollection] = useState<Pokefood[]>([])
  const [battlesWon, setBattlesWon] = useState(0)
  const [battlesLost, setBattlesLost] = useState(0)
  const [isMatchmaking, setIsMatchmaking] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const matchRequestIdRef = useRef(0)

  useEffect(() => {
    isAuthenticated().then((authedResult) => {
      setAuthed(authedResult)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!authed) {
      setCollection([])
      setBattlesWon(0)
      setBattlesLost(0)
      return
    }

    const loadData = async () => {
      const userId = await getCurrentUserId()
      const record = await loadBattleRecord(userId)
      setBattlesWon(record.won)
      setBattlesLost(record.lost)
      try {
        const fetched = await getUserCollection(userId)
        setCollection(fetched)
      } catch (e) {
        console.error(e)
      }
    }
    void loadData()
  }, [authed])

  const handleLogin = useCallback(async (email: string, password: string) => {
    await login(email, password)
    setAuthed(true)
  }, [])

  const handleRegister = useCallback(async (email: string, password: string) => {
    await register(email, password)
    await login(email, password)
    setAuthed(true)
  }, [])

  const handleLogout = useCallback(async () => {
    matchRequestIdRef.current += 1
    setIsMatchmaking(false)
    await logout()
    setAuthed(false)
    setCollection([])
    router.replace('/(auth)/login')
  }, [])

  const handleUpload = useCallback(async (base64: string) => {
    try {
      const newPokefood = await uploadFoodImage(base64)
      setCollection((prev) => [...prev, newPokefood])
    } catch (error) {
      console.error('Upload failed:', error)
      throw error
    }
  }, [])

  const handleNavigateToBattle = useCallback(async (pokefood: Pokefood) => {
    if (isMatchmaking) return

    const requestId = matchRequestIdRef.current + 1
    matchRequestIdRef.current = requestId
    setIsMatchmaking(true)

    try {
      const match = await createBattleMatch()
      if (matchRequestIdRef.current !== requestId) return

      router.push({
        pathname: '/(app)/battle',
        params: {
          pokefood: JSON.stringify({
            ...pokefood,
            createdAt: pokefood.createdAt.toISOString(),
          }),
          session: JSON.stringify(match),
        },
      })
    } catch (error) {
      if (matchRequestIdRef.current !== requestId) return
      console.error('Failed to start battle:', error)
    } finally {
      if (matchRequestIdRef.current === requestId) {
        setIsMatchmaking(false)
      }
    }
  }, [isMatchmaking])

  const handleTransfer = useCallback(async (pokefood: Pokefood) => {
    setIsTransferring(true)
    try {
      await deletePokefood(pokefood.id)
      setCollection((prev) => prev.filter((p) => p.id !== pokefood.id))
    } catch (error) {
      console.error('Transfer failed:', error)
    } finally {
      setIsTransferring(false)
    }
  }, [])

  const handleBattleResult = useCallback(async (result: 'win' | 'loss') => {
    const userId = await getCurrentUserId()
    const current = await loadBattleRecord(userId)
    const next = {
      won: current.won + (result === 'win' ? 1 : 0),
      lost: current.lost + (result === 'loss' ? 1 : 0),
    }
    await saveBattleRecord(userId, next.won, next.lost)
    setBattlesWon(next.won)
    setBattlesLost(next.lost)
  }, [])

  return (
    <AppContext.Provider
      value={{
        isAuthenticated: authed,
        isLoading,
        collection,
        battlesWon,
        battlesLost,
        isMatchmaking,
        isTransferring,
        handleLogin,
        handleRegister,
        handleLogout,
        handleUpload,
        handleNavigateToBattle,
        handleTransfer,
        handleBattleResult,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}
