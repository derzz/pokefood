import type { Pokefood, Move } from './types'

/**
 * API client for Pokefood backend communication
 * TODO: Replace with actual backend endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  return localStorage.getItem('pokefood.accessToken')
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
  const userId = localStorage.getItem('pokefood.userId') || 'current-user'

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
