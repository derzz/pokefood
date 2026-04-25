from pydantic import BaseModel, Field


class FoodCategory(BaseModel):
    name: str = Field(description="Category name, e.g. 'health', 'cuisine', 'meal_type'")
    labels: list[str] = Field(description="Possible labels within this category")
    description: str | None = Field(default=None, description="What this category classifies")


class FoodLabelSchema(BaseModel):
    categories: list[FoodCategory] = Field(description="All classification categories")
    description: str | None = Field(default=None, description="Overall description of the labeling schema")
