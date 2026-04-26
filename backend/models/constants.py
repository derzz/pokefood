from enum import Enum


class FoodType(str, Enum):
    MEAT = "meat"
    GRAINS = "grains"
    FRUITS_VEGETABLES = "fruits_vegetables"
