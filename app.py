from flask import Flask, render_template, jsonify, request
import json
from typing import List, Dict, Any
from collections import defaultdict

app = Flask(__name__)

# Load recipe database
def load_recipes():
    with open('recipe_db.json', 'r', encoding='utf-8') as f:
        return json.load(f)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    """Get all recipes or filtered by search query"""
    recipes = load_recipes()
    query = request.args.get('q', '').lower()
    recipe_type = request.args.get('type', None)

    if query:
        filtered_recipes = []
        for recipe in recipes:
            # Search in name, type, tags, ingredients (name and alternatives)
            searchable_text = ' '.join([
                recipe.get('name', '').lower(),
                recipe.get('type', '').lower(),
                ' '.join(recipe.get('tags', [])).lower(),
                ' '.join([ing.get('name', '').lower() for ing in recipe.get('ingredients', [])]),
                ' '.join([' '.join(ing.get('alternatives', [])).lower() for ing in recipe.get('ingredients', [])])
            ])

            if query in searchable_text:
                filtered_recipes.append(recipe)
        recipes = filtered_recipes

    # Filter by type if specified
    if recipe_type:
        recipes = [r for r in recipes if r.get('type', '').lower() == recipe_type.lower()]

    return jsonify(recipes)

@app.route('/api/shopping-list', methods=['POST'])
def generate_shopping_list():
    """Generate aggregated shopping list from selected recipes"""
    data = request.json
    selected_recipes = data.get('recipes', [])

    recipes_db = load_recipes()
    aggregated = defaultdict(lambda: {'quantity': 0, 'unit': None, 'olhometro_items': [], 'recipes': set(), 'category': None})

    for selection in selected_recipes:
        recipe_name = selection.get('name')
        servings_selected = selection.get('servings', 1)

        # Find the recipe in database
        recipe = next((r for r in recipes_db if r['name'] == recipe_name), None)
        if not recipe:
            continue

        original_servings = recipe.get('serves', 1)
        multiplier = servings_selected / original_servings

        # Process ingredients
        for ingredient in recipe.get('ingredients', []):
            ing_name = ingredient.get('name')
            ing_quantity = ingredient.get('quantity')
            ing_unit = ingredient.get('unit')
            ing_category = ingredient.get('category', 'Other')

            # Store category (use first encountered category for ingredient)
            if aggregated[ing_name]['category'] is None:
                aggregated[ing_name]['category'] = ing_category

            # Handle olhómetro separately
            if ing_unit == 'olhómetro':
                # Store olhómetro items separately
                aggregated[ing_name]['olhometro_items'].append({
                    'quantity': ing_quantity,
                    'recipe': recipe_name
                })
                aggregated[ing_name]['recipes'].add(recipe_name)
            else:
                # Try to convert quantity to number and scale it
                try:
                    if isinstance(ing_quantity, (int, float)):
                        scaled_quantity = ing_quantity * multiplier

                        # If this ingredient already has a unit set, verify it matches
                        if aggregated[ing_name]['unit'] is None:
                            aggregated[ing_name]['unit'] = ing_unit
                        elif aggregated[ing_name]['unit'] != ing_unit:
                            # Different units for same ingredient - keep separate
                            new_key = f"{ing_name} ({ing_unit})"
                            aggregated[new_key]['quantity'] += scaled_quantity
                            aggregated[new_key]['unit'] = ing_unit
                            aggregated[new_key]['recipes'].add(recipe_name)
                            aggregated[new_key]['category'] = ing_category
                            continue

                        aggregated[ing_name]['quantity'] += scaled_quantity
                        aggregated[ing_name]['recipes'].add(recipe_name)
                    else:
                        # Non-numeric quantity, treat as olhómetro
                        aggregated[ing_name]['olhometro_items'].append({
                            'quantity': ing_quantity,
                            'recipe': recipe_name
                        })
                        aggregated[ing_name]['recipes'].add(recipe_name)
                except (ValueError, TypeError):
                    # If conversion fails, treat as olhómetro
                    aggregated[ing_name]['olhometro_items'].append({
                        'quantity': ing_quantity,
                        'recipe': recipe_name
                    })
                    aggregated[ing_name]['recipes'].add(recipe_name)

    # Group by category and sort
    by_category = defaultdict(list)

    for ingredient, data in aggregated.items():
        recipes_str = ', '.join(sorted(data['recipes']))
        category = data['category'] or 'Other'

        # If ingredient has both quantities and olhómetro
        if data['quantity'] > 0 and data['olhometro_items']:
            # Add the numeric quantity item
            by_category[category].append({
                'name': ingredient,
                'quantity': round(data['quantity'], 2),
                'unit': data['unit'],
                'recipes': recipes_str,
                'category': category,
                'display': f"{ingredient}: {round(data['quantity'], 2)} {data['unit']}"
            })
            # Add the olhómetro item
            by_category[category].append({
                'name': ingredient,
                'quantity': 'q.b.',
                'unit': 'olhómetro',
                'recipes': recipes_str,
                'category': category,
                'display': f"{ingredient}: q.b."
            })
        elif data['olhometro_items']:
            # Only olhómetro
            by_category[category].append({
                'name': ingredient,
                'quantity': 'q.b.',
                'unit': 'olhómetro',
                'recipes': recipes_str,
                'category': category,
                'display': f"{ingredient}: q.b."
            })
        else:
            # Only numeric quantity
            by_category[category].append({
                'name': ingredient,
                'quantity': round(data['quantity'], 2),
                'unit': data['unit'],
                'recipes': recipes_str,
                'category': category,
                'display': f"{ingredient}: {round(data['quantity'], 2)} {data['unit']}"
            })

    # Sort categories alphabetically and items within each category
    shopping_list = []
    for category in sorted(by_category.keys()):
        # Sort items within category alphabetically by name
        items = sorted(by_category[category], key=lambda x: x['name'].lower())
        shopping_list.append({
            'type': 'category',
            'name': category
        })
        shopping_list.extend(items)

    return jsonify(shopping_list)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
