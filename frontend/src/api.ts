import type { Pokefood, Move, FoodType, UploadRequest } from './types'

/**
 * API client for Pokefood backend communication
 * TODO: Replace with actual backend endpoints
 */

const API_BASE_URL = 'http://localhost:8000'

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

  const uploadRequest: UploadRequest = {
    imageBase64,
    filename: file.name,
    mimeType: file.type,
  }

  const response = await fetch(`${API_BASE_URL}/food/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(uploadRequest),
  })

  if (!response.ok) {
    throw new Error('Failed to upload food image')
  }

  return response.json()
}

/**
 * Get all user's Pokefood collection
 */
export async function getUserCollection(userId: string): Promise<Pokefood[]> {
  const response = await fetch(`${API_BASE_URL}/users/${userId}/pokefood`)

  if (!response.ok) {
    throw new Error('Failed to fetch collection')
  }

  return response.json()
}

/**
 * Get a single Pokefood by ID
 */
export async function getPokefood(id: string): Promise<Pokefood> {
  const response = await fetch(`${API_BASE_URL}/pokefood/${id}`)

  if (!response.ok) {
    throw new Error('Failed to fetch Pokefood')
  }

  return response.json()
}

/**
 * Generate random opponent for battle
 */
export async function getRandomOpponent(): Promise<Pokefood> {
  const response = await fetch(`${API_BASE_URL}/pokefood/random`)

  if (!response.ok) {
    throw new Error('Failed to fetch opponent')
  }

  return response.json()
}

/**
 * Submit battle result
 */
export async function submitBattleResult(
  winnerId: string,
  loserId: string,
  playerWon: boolean
): Promise<{ exp: number; rewards: unknown }> {
  const response = await fetch(`${API_BASE_URL}/battles/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      winnerId,
      loserId,
      playerWon,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to submit battle result')
  }

  return response.json()
}

/**
 * Generate moves for a Pokefood based on its type
 */
export async function generateMoves(foodType: FoodType): Promise<Move[]> {
  const response = await fetch(`${API_BASE_URL}/moves/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foodType }),
  })

  if (!response.ok) {
    throw new Error('Failed to generate moves')
  }

  return response.json()
}
