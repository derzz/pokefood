import type { BattleMatchSession, Move, Pokefood } from './types'

/**
 * API client for Pokefood backend communication
 * TODO: Replace with actual backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const ACCESS_TOKEN_KEY = 'pokefood.accessToken'
const USER_ID_KEY = 'pokefood.userId'

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
  type: 'fruveg' | 'meat' | 'grain'
  moves: BackendMove[]
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

function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getCurrentUserId(): string {
  return localStorage.getItem(USER_ID_KEY) || 'current-user'
}

type BackendLoginResponse = {
  access_token: string
  token_type: 'bearer'
}

type BackendDevLoginResponse = {
  access_token: string
  token_type: 'bearer'
}

export async function login(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Login failed')
  }

  const payload = (await response.json()) as BackendLoginResponse
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token)
  localStorage.setItem(USER_ID_KEY, email)
}

export async function devLogin(email?: string): Promise<void> {
  const resolvedEmail = (email || 'demo@pokefood.local').trim().toLowerCase()
  const query = new URLSearchParams({ email: resolvedEmail })

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/dev-login?${query.toString()}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Dev login failed')
  }

  const payload = (await response.json()) as BackendDevLoginResponse
  localStorage.setItem(ACCESS_TOKEN_KEY, payload.access_token)
  localStorage.setItem(USER_ID_KEY, resolvedEmail)
}

export function logout(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken())
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
    headers: {
      ...buildAuthHeaders(),
    },
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
  const wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws')
  const query = new URLSearchParams({ player_id: match.playerId })
  return `${wsBaseUrl}/ws/battle/${match.roomId}?${query.toString()}`
}

function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken()

  if (!token) {
    throw new Error('No access token found. Save a token in localStorage under "pokefood.accessToken".')
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}

function mapBackendType(type: BackendPokefood['type']): Pokefood['type'] {
  if (type === 'meat') return 'Meat'
  if (type === 'grain') return 'Grain'
  return 'Fruit'
}

function mapBackendMove(move: BackendMove, idx: number): Move {
  return {
    id: `${move.name}-${idx}`,
    name: move.name,
    type: 'Meat',
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
  return {
    id,
    name: source.personal_name || source.name,
    imageUrl: toImageDataUrl(source.image_base64),
    type: mapBackendType(source.type),
    variant: 'Normal',
    rarity: 'Common',
    hp: source.hp,
    atk: Math.max(1, Math.round(source.hp * 0.6)),
    mp: 40,
    moves: source.moves.map(mapBackendMove),
    nutritionInfo: {
      calories: 0,
      fat: 0,
      protein: 0,
      carbs: 0,
    },
    createdAt,
    uploadedBy,
  }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Extract base64 string after the comma
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Upload food image and generate Pokefood
 * Sends image as base64-encoded JSON
 */
export async function uploadFoodImage(file: File): Promise<Pokefood> {
  const imageBase64 = await fileToBase64(file)

  const response = await fetch(`${API_BASE_URL}/api/v1/pokefoods/from-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...buildAuthHeaders(),
    },
    body: JSON.stringify({
      image_base64: imageBase64,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to upload food image')
  }

  const payload = (await response.json()) as BackendCreateResponse
  const userId = getCurrentUserId()

  return mapBackendPokefoodToFrontend(
    payload.pokefood,
    String(payload.stored_pokefood_id),
    new Date(),
    userId,
  )
}

/**
 * Get all user's Pokefood collection
 */
export async function getUserCollection(userId: string): Promise<Pokefood[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/pokefoods`, {
    headers: {
      ...buildAuthHeaders(),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to fetch collection')
  }

  const payload = (await response.json()) as BackendStoredPokefood[]

  return payload.map((row) =>
    mapBackendPokefoodToFrontend(
      row.pokefood,
      String(row.id),
      new Date(row.created_at),
      userId,
    ),
  )
}
