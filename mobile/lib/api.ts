import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import type { BattleMatchSession, Move, Pokefood, Rarity } from './types'
import { FoodType } from './constants'

const RAW_API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ?? 'http://127.0.0.1:8000'
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '')
const API_POKEFOODS_BASE_PATH = '/api/v1/pokefoods'
const API_POKEFOODS_GET_ALL_PATH = `${API_POKEFOODS_BASE_PATH}/all`
const NGROK_SKIP_HEADER_KEY = 'ngrok-skip-browser-warning'
const NGROK_SKIP_HEADER_VALUE = 'true'
const ACCESS_TOKEN_KEY = 'pokefood.accessToken'
const USER_ID_KEY = 'pokefood.userId'

async function readStorageValue(key: string): Promise<string | null> {
  return AsyncStorage.getItem(key)
}

async function writeStorageValue(key: string, value: string): Promise<void> {
  return AsyncStorage.setItem(key, value)
}

async function clearAuthStorage(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, USER_ID_KEY])
}

type BackendMove = {
  name: string
  damage: number
}

type BackendPokefood = {
  personal_name: string
  name: string
  image_base64: string
  labels: string[]
  hp: number
  type: FoodType
  moves: BackendMove[]
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

type BackendCreateResponse = {
  pokefood: BackendPokefood
  source_confidence: number
  stored_pokefood_id: number
}

type BackendStoredPokefood = {
  id: number
  created_at: string
  pokefood: BackendPokefood
}

async function getAccessToken(): Promise<string | null> {
  return readStorageValue(ACCESS_TOKEN_KEY)
}

export async function getCurrentUserId(): Promise<string> {
  return (await readStorageValue(USER_ID_KEY)) ?? 'current-user'
}

type BackendLoginResponse = {
  access_token: string
  token_type: 'bearer'
}

function buildBaseHeaders(): HeadersInit {
  return {
    [NGROK_SKIP_HEADER_KEY]: NGROK_SKIP_HEADER_VALUE,
  }
}

async function buildAuthHeaders(): Promise<HeadersInit> {
  const token = await getAccessToken()
  if (!token) {
    throw new Error('No access token found. Sign in again.')
  }
  return {
    ...buildBaseHeaders(),
    Authorization: `Bearer ${token}`,
  }
}

export async function register(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      ...buildBaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    let errorMessage = 'Registration failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      errorMessage = (await response.text()) || errorMessage
    }
    throw new Error(errorMessage)
  }
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      ...buildBaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Login failed')
  }

  const payload = (await response.json()) as BackendLoginResponse
  await writeStorageValue(ACCESS_TOKEN_KEY, payload.access_token)
  await writeStorageValue(USER_ID_KEY, email)
}

export async function logout(): Promise<void> {
  await clearAuthStorage()
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken()
  return Boolean(token)
}

type BackendMatchmakeResponse = {
  room_id: string
  player_id: string
  opponent_id: string
  mode: 'mock'
}

export async function createBattleMatch(): Promise<BattleMatchSession> {
  const response = await fetch(`${API_BASE_URL}/api/v1/battles/matchmake`, {
    method: 'POST',
    headers: await buildAuthHeaders(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to create battle match')
  }

  const payload = (await response.json()) as BackendMatchmakeResponse
  return {
    roomId: payload.room_id,
    playerId: payload.player_id,
    opponentId: payload.opponent_id,
  }
}

export function buildBattleWebSocketUrl(match: BattleMatchSession): string {
  const wsUrl = new URL(API_BASE_URL)
  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  wsUrl.pathname = `/ws/battle/${encodeURIComponent(match.roomId)}`
  wsUrl.search = new URLSearchParams({ player_id: match.playerId }).toString()
  return wsUrl.toString()
}

function mapBackendMove(move: BackendMove, idx: number): Move {
  return {
    id: `${move.name}-${idx}`,
    name: move.name,
    type: FoodType.MEAT,
    power: move.damage,
    mpCost: 10,
    accuracy: 100,
    isMutated: false,
  }
}

function toImageDataUrl(base64: string): string {
  if (base64.startsWith('data:image')) {
    return base64
  }
  return `data:image/png;base64,${base64}`
}

function mapBackendPokefoodToFrontend(
  source: BackendPokefood,
  id: string,
  createdAt: Date,
  uploadedBy: string,
): Pokefood {
  const isMigu = source.name.toLowerCase() === 'migu' && source.rarity === 'legendary'
  return {
    id,
    name: source.personal_name || source.name,
    imageUrl: toImageDataUrl(source.image_base64),
    type: source.type,
    variant: 'Normal',
    rarity: source.rarity
      ? ((source.rarity.charAt(0).toUpperCase() + source.rarity.slice(1)) as Rarity)
      : 'Common',
    hp: source.hp,
    atk: isMigu ? 1000 : Math.max(1, Math.round(source.hp * 0.6)),
    mp: 40,
    moves: source.moves.map(mapBackendMove),
    nutritionInfo: { calories: 0, fat: 0, protein: 0, carbs: 0 },
    createdAt,
    uploadedBy,
  }
}

export async function uploadFoodImage(base64: string): Promise<Pokefood> {
  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_BASE_PATH}/from-image`, {
    method: 'POST',
    headers: {
      ...(await buildAuthHeaders()),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image_base64: base64 }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to upload food image')
  }

  const payload = (await response.json()) as BackendCreateResponse
  const userId = await getCurrentUserId()
  return mapBackendPokefoodToFrontend(
    payload.pokefood,
    String(payload.stored_pokefood_id),
    new Date(),
    userId,
  )
}

export async function getUserCollection(userId: string): Promise<Pokefood[]> {
  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_GET_ALL_PATH}`, {
    method: 'GET',
    headers: await buildAuthHeaders(),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to fetch collection')
  }

  const payload = (await response.json()) as BackendStoredPokefood[]
  return payload.map((row) =>
    mapBackendPokefoodToFrontend(row.pokefood, String(row.id), new Date(row.created_at), userId),
  )
}

export async function deletePokefood(pokefoodId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_BASE_PATH}/${pokefoodId}`, {
    method: 'DELETE',
    headers: await buildAuthHeaders(),
  })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to delete Pokefood')
  }
}
