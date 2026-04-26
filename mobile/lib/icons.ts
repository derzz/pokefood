import { ImageSourcePropType } from 'react-native'
import { FoodType } from './constants'

export const CATEGORY_ICONS = {
  regional_heritage: {
    src: require('../assets/icons/categories/regional_heritage.png') as ImageSourcePropType,
    label: 'Regional Heritage',
    alt: 'Globe representing regional heritage',
  },
  preparation_method: {
    src: require('../assets/icons/categories/preparation_method.png') as ImageSourcePropType,
    label: 'Preparation Method',
    alt: 'Fire representing cooking method',
  },
  health: {
    src: require('../assets/icons/categories/health.png') as ImageSourcePropType,
    label: 'Health',
    alt: 'Herb representing health benefits',
  },
  meal_course: {
    src: require('../assets/icons/categories/meal_course.png') as ImageSourcePropType,
    label: 'Meal Course',
    alt: 'Fork and knife representing meal course',
  },
  temperature: {
    src: require('../assets/icons/categories/temperature.png') as ImageSourcePropType,
    label: 'Temperature',
    alt: 'Thermometer representing temperature',
  },
  texture: {
    src: require('../assets/icons/categories/texture.png') as ImageSourcePropType,
    label: 'Texture',
    alt: 'Droplet representing texture',
  },
  prep_time: {
    src: require('../assets/icons/categories/prep_time.png') as ImageSourcePropType,
    label: 'Prep Time',
    alt: 'Hourglass representing prep time',
  },
} as const

export const TYPE_ICONS: Record<FoodType, { src: ImageSourcePropType; label: string; alt: string }> = {
  [FoodType.MEAT]: {
    src: require('../assets/icons/types/meat.png') as ImageSourcePropType,
    label: 'Meat',
    alt: 'Cut of meat',
  },
  [FoodType.GRAINS]: {
    src: require('../assets/icons/types/grains.png') as ImageSourcePropType,
    label: 'Grains',
    alt: 'Sheaf of rice',
  },
  [FoodType.FRUITS_VEGETABLES]: {
    src: require('../assets/icons/types/fruits_vegetables.png') as ImageSourcePropType,
    label: 'Fruits & Vegetables',
    alt: 'Broccoli representing fruits and vegetables',
  },
}

export const STAT_ICONS = {
  hp: {
    src: require('../assets/icons/categories/health.png') as ImageSourcePropType,
    label: 'HP',
    alt: 'Health',
  },
  mp: {
    src: require('../assets/icons/categories/prep_time.png') as ImageSourcePropType,
    label: 'MP',
    alt: 'Energy / Magic Power',
  },
  atk: {
    src: require('../assets/icons/categories/preparation_method.png') as ImageSourcePropType,
    label: 'Attack',
    alt: 'Attack power',
  },
} as const

export const NUTRITION_ICONS = {
  calories: {
    src: require('../assets/icons/categories/meal_course.png') as ImageSourcePropType,
    label: 'Calories',
    alt: 'Calories',
  },
  protein: {
    src: require('../assets/icons/types/meat.png') as ImageSourcePropType,
    label: 'Protein',
    alt: 'Protein',
  },
  carbs: {
    src: require('../assets/icons/types/grains.png') as ImageSourcePropType,
    label: 'Carbs',
    alt: 'Carbohydrates',
  },
  fat: {
    src: require('../assets/icons/categories/texture.png') as ImageSourcePropType,
    label: 'Fat',
    alt: 'Fat content',
  },
} as const

export type CategoryIconKey = keyof typeof CATEGORY_ICONS
export type StatIconKey = keyof typeof STAT_ICONS
export type NutritionIconKey = keyof typeof NUTRITION_ICONS

export const getCategoryIcon = (key: string) =>
  CATEGORY_ICONS[key as CategoryIconKey] || null

export const getTypeIcon = (key: string) =>
  TYPE_ICONS[key as FoodType] ?? null

export const getStatIcon = (key: string) =>
  STAT_ICONS[key as StatIconKey] || null

export const getNutritionIcon = (key: string) =>
  NUTRITION_ICONS[key as NutritionIconKey] || null
