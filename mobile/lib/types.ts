import { FoodType } from './constants'
export { FoodType }

export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary'

export type FoodVariant = 'Normal' | 'Garnished' | 'Healthy'

export interface Move {
  id: string
  name: string
  type: FoodType
  power: number
  mpCost: number
  accuracy: number
  isMutated: boolean
}

export interface Pokefood {
  id: string
  name: string
  imageUrl: string
  pixelArtUrl?: string
  type: FoodType
  variant: FoodVariant
  rarity: Rarity
  hp: number
  atk: number
  mp: number
  moves: Move[]
  nutritionInfo: {
    calories: number
    fat: number
    protein: number
    carbs: number
  }
  createdAt: Date
  uploadedBy: string
}

export interface BattleMatchSession {
  roomId: string
  playerId: string
  opponentId: string
}

export interface BattlePlayerSnapshot {
  player_id: string
  ready: boolean
  current_hp: number | null
  pokefood: {
    personal_name: string
    name: string
    image_base64: string
    labels: string[]
    hp: number
    type: FoodType
    moves: Array<{
      name: string
      damage: number
    }>
  } | null
}

export interface BattleRoomSnapshot {
  room_id: string
  status: 'waiting' | 'in_progress' | 'finished'
  turn_player_id: string | null
  players: Record<string, BattlePlayerSnapshot>
}

export interface BattleActionResult {
  attacker_id: string
  defender_id: string
  move: string
  type_multiplier: number
  damage: number
  winner_id: string | null
}
