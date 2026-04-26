from enum import Enum

from pydantic import BaseModel, Field

from models.constants import FoodType


class Rarity(str, Enum):
    common = "common"
    rare = "rare"
    epic = "epic"
    legendary = "legendary"


class FoodCategory(BaseModel):
    name: str = Field(description="Category name, e.g. 'health', 'cuisine', 'meal_type'")
    labels: list[str] = Field(description="Possible labels within this category")
    description: str | None = Field(default=None, description="What this category classifies")


class FoodLabelSchema(BaseModel):
    categories: list[FoodCategory] = Field(description="All classification categories")
    description: str | None = Field(default=None, description="Overall description of the labeling schema")


DEFAULT_FOOD_LABEL_SCHEMA = FoodLabelSchema(
    description="Food labeling schema covering heritage, preparation, nutrition, and serving traits.",
    categories=[
        FoodCategory(
            name="regional_heritage",
            description="Cuisine or cultural region the dish is associated with.",
            labels=[
                "European",
                "Mediterranean & Middle Eastern",
                "East and Southwest Asian",
                "Latin American and Caribbean",
                "South Asian & India",
            ],
        ),
        FoodCategory(
            name="preparation_method",
            description="How the dish is primarily prepared.",
            labels=["Raw", "Braised", "Fried", "Bake"],
        ),
        FoodCategory(
            name="health",
            description="Processing level of the food.",
            labels=["Whole foods", "Processed", "Ultra processed"],
        ),
        FoodCategory(
            name="meal_course",
            description="Typical position in a meal.",
            labels=["Appetizer", "Entree", "Dessert"],
        ),
        FoodCategory(
            name="temperature",
            description="Typical serving temperature.",
            labels=["Cold", "Hot", "Room Temperature"],
        ),
        FoodCategory(
            name="texture",
            description="Dominant mouthfeel.",
            labels=["Crispy", "Liquid", "Chewy"],
        ),
        FoodCategory(
            name="prep_time",
            description="Estimated preparation time and effort.",
            labels=[
                "Quick (under 15 minutes)",
                "Slow cook (1 hour+)",
                "No cook (no heat required)",
            ],
        ),
    ],
)
class CategoryLabel(BaseModel):
    category: str = Field(description="The category name, matching one of the schema's category names")
    label: str = Field(description="The selected label for this category")


class FoodLabelResult(BaseModel):
    name: str = Field(description="The name of the food item")
    description: str = Field(description="A brief description of the food item")
    type: FoodType = Field(description=f"Primary food type: {', '.join(repr(t.value) for t in FoodType)}")
    labels: list[CategoryLabel] = Field(description="One entry per category in the schema")
    rarity: Rarity = Field(description="Visual rarity based on how impressive or rare the dish appears: common, rare, epic, or legendary")
