/**
 * Icon paths and metadata for displaying emoji icons throughout the app
 */

export const CATEGORY_ICONS = {
  regional_heritage: {
    src: '/categories/regional_heritage.png',
    label: 'Regional Heritage',
    alt: 'Globe representing regional heritage'
  },
  preparation_method: {
    src: '/categories/preparation_method.png',
    label: 'Preparation Method',
    alt: 'Fire representing cooking method'
  },
  health: {
    src: '/categories/health.png',
    label: 'Health',
    alt: 'Herb representing health benefits'
  },
  meal_course: {
    src: '/categories/meal_course.png',
    label: 'Meal Course',
    alt: 'Fork and knife representing meal course'
  },
  temperature: {
    src: '/categories/temperature.png',
    label: 'Temperature',
    alt: 'Thermometer representing temperature'
  },
  texture: {
    src: '/categories/texture.png',
    label: 'Texture',
    alt: 'Droplet representing texture'
  },
  prep_time: {
    src: '/categories/prep_time.png',
    label: 'Prep Time',
    alt: 'Hourglass representing prep time'
  }
} as const

export const TYPE_ICONS = {
  meat: {
    src: '/types/meat.png',
    label: 'Meat',
    alt: 'Cut of meat'
  },
  grains: {
    src: '/types/grains.png',
    label: 'Grains',
    alt: 'Sheaf of rice'
  },
  fruits_vegetables: {
    src: '/types/fruits_vegetables.png',
    label: 'Fruits & Vegetables',
    alt: 'Broccoli representing fruits and vegetables'
  }
} as const

// Stat icons - using existing category icons as they work well for stats
export const STAT_ICONS = {
  hp: {
    src: '/categories/health.png',
    label: 'HP',
    alt: 'Health'
  },
  mp: {
    src: '/categories/prep_time.png',
    label: 'MP',
    alt: 'Energy / Magic Power'
  },
  atk: {
    src: '/categories/preparation_method.png',
    label: 'Attack',
    alt: 'Attack power'
  }
} as const

// Nutrition icons - using category icons for nutrition info
export const NUTRITION_ICONS = {
  calories: {
    src: '/categories/meal_course.png',
    label: 'Calories',
    alt: 'Calories'
  },
  protein: {
    src: '/types/meat.png',
    label: 'Protein',
    alt: 'Protein'
  },
  carbs: {
    src: '/types/grains.png',
    label: 'Carbs',
    alt: 'Carbohydrates'
  },
  fat: {
    src: '/categories/texture.png',
    label: 'Fat',
    alt: 'Fat content'
  }
} as const

export type CategoryIconKey = keyof typeof CATEGORY_ICONS
export type TypeIconKey = keyof typeof TYPE_ICONS
export type StatIconKey = keyof typeof STAT_ICONS
export type NutritionIconKey = keyof typeof NUTRITION_ICONS

const TYPE_ICON_ALIASES: Record<string, TypeIconKey> = {
  meat: 'meat',
  grain: 'grains',
  grains: 'grains',
  fruveg: 'fruits_vegetables',
  fruit: 'fruits_vegetables',
  fruits: 'fruits_vegetables',
  vegetable: 'fruits_vegetables',
  vegetables: 'fruits_vegetables',
  fruits_vegetables: 'fruits_vegetables'
}

export const getCategoryIcon = (key: string) => {
  return CATEGORY_ICONS[key as CategoryIconKey] || null
}

export const getTypeIcon = (key: string) => {
  const normalizedKey = key.trim().toLowerCase().replace(/[\s-]+/g, '_')
  const resolvedKey = TYPE_ICON_ALIASES[normalizedKey]
  return resolvedKey ? TYPE_ICONS[resolvedKey] : null
}

export const getStatIcon = (key: string) => {
  return STAT_ICONS[key as StatIconKey] || null
}

export const getNutritionIcon = (key: string) => {
  return NUTRITION_ICONS[key as NutritionIconKey] || null
}
