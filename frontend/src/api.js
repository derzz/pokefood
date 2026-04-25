const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const LOCAL_COLLECTION_KEY = 'pokefood.collection.v1'

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function mapServerPokefood(payload, source) {
  const serverPokefood = payload?.pokefood ?? payload

  return {
    id: makeId(),
    personalName: serverPokefood.personal_name,
    name: serverPokefood.name,
    imageUrl: serverPokefood.image_url,
    labels: Array.isArray(serverPokefood.labels) ? serverPokefood.labels : [],
    hp: serverPokefood.hp,
    type: serverPokefood.type,
    moves: Array.isArray(serverPokefood.moves) ? serverPokefood.moves : [],
    sourceConfidence:
      typeof payload?.source_confidence === 'number'
        ? payload.source_confidence
        : null,
    source,
    createdAt: new Date().toISOString(),
  }
}

export async function createPokefoodFromImage({ bucket, objectPath }) {
  const response = await fetch(`${API_BASE_URL}/api/v1/monsters/from-image`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bucket,
      object_path: objectPath,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to create pokefood')
  }

  const payload = await response.json()
  return mapServerPokefood(payload, {
    bucket,
    objectPath,
  })
}

export function loadUserPokefoods() {
  const raw = localStorage.getItem(LOCAL_COLLECTION_KEY)

  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveUserPokefoods(collection) {
  localStorage.setItem(LOCAL_COLLECTION_KEY, JSON.stringify(collection))
}
