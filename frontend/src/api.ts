import type { BattleMatchSession, Move, Pokefood, Rarity } from './types'
import { FoodType } from './constants'

/**
 * API client for Pokefood backend communication
 * TODO: Replace with actual backend endpoints
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL
  : 'http://127.0.0.1:8000'
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, '')
const API_POKEFOODS_BASE_PATH = '/api/v1/pokefoods'
const API_POKEFOODS_GET_ALL_PATH = `${API_POKEFOODS_BASE_PATH}/all`
const NGROK_SKIP_HEADER_KEY = 'ngrok-skip-browser-warning'
const NGROK_SKIP_HEADER_VALUE = 'true'
const ACCESS_TOKEN_KEY = 'pokefood.accessToken'
const USER_ID_KEY = 'pokefood.userId'

function readSessionValue(key: string): string | null {
  return sessionStorage.getItem(key)
}

function writeSessionValue(key: string, value: string): void {
  sessionStorage.setItem(key, value)
}

function clearAuthStorage(): void {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(USER_ID_KEY)
  // Clear legacy shared-tab storage values so tabs can fully diverge after this release.
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
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

function getAccessToken(): string | null {
  return readSessionValue(ACCESS_TOKEN_KEY)
}

export function getCurrentUserId(): string {
  return readSessionValue(USER_ID_KEY) || 'current-user'
}

type BackendLoginResponse = {
  access_token: string
  token_type: 'bearer'
}

type BackendDevLoginResponse = {
  access_token: string
  token_type: 'bearer'
}

function buildBaseHeaders(): HeadersInit {
  return {
    [NGROK_SKIP_HEADER_KEY]: NGROK_SKIP_HEADER_VALUE,
  }
}

/**
 * Register a new user account
 */
export async function register(email: string, password: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: {
      ...buildBaseHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    let errorMessage = 'Registration failed'
    try {
      const errorData = await response.json()
      errorMessage = errorData.detail || errorData.message || errorMessage
    } catch {
      errorMessage = await response.text() || errorMessage
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
  writeSessionValue(ACCESS_TOKEN_KEY, payload.access_token)
  writeSessionValue(USER_ID_KEY, email)
}

export async function devLogin(email?: string): Promise<void> {
  const resolvedEmail = (email || 'demo@pokefood.local').trim().toLowerCase()
  const query = new URLSearchParams({ email: resolvedEmail })

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/dev-login?${query.toString()}`, {
    method: 'POST',
    headers: {
      ...buildBaseHeaders(),
    },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Dev login failed')
  }

  const payload = (await response.json()) as BackendDevLoginResponse
  writeSessionValue(ACCESS_TOKEN_KEY, payload.access_token)
  writeSessionValue(USER_ID_KEY, resolvedEmail)
}

export function logout(): void {
  clearAuthStorage()
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
  const wsUrl = new URL(API_BASE_URL)
  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:'
  wsUrl.pathname = `/ws/battle/${encodeURIComponent(match.roomId)}`
  wsUrl.search = new URLSearchParams({ player_id: match.playerId }).toString()
  return wsUrl.toString()
}

function buildAuthHeaders(): HeadersInit {
  const token = getAccessToken()

  if (!token) {
    throw new Error('No access token found. Sign in again in this tab to create a tab-scoped session.')
  }

  return {
    ...buildBaseHeaders(),
    Authorization: `Bearer ${token}`,
  }
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
    rarity: source.rarity ? (source.rarity.charAt(0).toUpperCase() + source.rarity.slice(1)) as Rarity : 'Common',
    hp: source.hp,
    atk: isMigu ? 1000 : Math.max(1, Math.round(source.hp * 0.6)),
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

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Upload food image and generate Pokefood
 * Sends image as base64-encoded JSON
 */
export async function uploadFoodImage(file: File): Promise<Pokefood> {
  const imageBase64 = await fileToBase64(file)

  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_BASE_PATH}/from-image`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(),
      'Content-Type': 'application/json',
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
 * Create the legendary Migu card from the public frontend asset.
 */
export async function createMiguCard(): Promise<Pokefood> {
  const assetResponse = await fetch('/misc/migu.png')

  if (!assetResponse.ok) {
    throw new Error('Failed to load migu.png')
  }

  const imageBase64 = await blobToBase64(await assetResponse.blob())

  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_BASE_PATH}/migu`, {
    method: 'POST',
    headers: {
      ...buildAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_base64: imageBase64,
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to create Migu card')
  }

  const payload = (await response.json()) as BackendStoredPokefood
  const userId = getCurrentUserId()

  return mapBackendPokefoodToFrontend(
    payload.pokefood,
    String(payload.id),
    new Date(payload.created_at),
    userId,
  )
}

/**
 * Get all user's Pokefood collection
 */
export async function getUserCollection(userId: string): Promise<Pokefood[]> {
  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_GET_ALL_PATH}`, {
    method: 'GET',
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

export async function deletePokefood(pokefoodId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${API_POKEFOODS_BASE_PATH}/${pokefoodId}`, {
    method: 'DELETE',
    headers: buildAuthHeaders(),
  })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(errorBody || 'Failed to delete Pokefood')
  }
}
