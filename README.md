# Meal Planning and Recipe Database
Vibe-coded meal planning web app with a recipe database and shopping list generator.

## Add a recipe
Add a recipe to `recipe_db.json` in the following format:

```json
{
    "name": "Recipe Name",
    "type": "Soup" or "Main",
    "ingredients": [
        {
            "name": "Ingredient Name",
            "quantity": 100,
            "unit": "g",
            "alternatives": ["Alternative 1", "Alternative 2"]
        }
    ],
    "instructions": ["Step 1", "Step 2"],
    "notes": ["Note 1"],
    "serves": 1,
    "tags": ["Tag1", "Tag2"]
}
```
>IMPORTANT: If an ingrediant doesn't have a specific quantity, set the unit to "olhómetro" and the quantity to "q.b.". This affects how the shopping list is generated.

>When writing an ingredient name, check if it already exists in another recipe. If it does, copy the name exactly to ensure proper quantity aggregation in the shopping list.

## Run the app
```bash
git clone https://github.com/zeppombal/meal-planning.git
cd meal-planning
pip install -r requirements.txt
python app.py
```
>Open your browser and navigate to `http://localhost:5000`