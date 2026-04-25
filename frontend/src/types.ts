export type FoodType = 'Fruit' | 'Vegetable' | 'Grain' | 'Meat' | 'Junk'

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

export interface UploadRequest {
  imageBase64: string
  filename: string
  mimeType: string
}
