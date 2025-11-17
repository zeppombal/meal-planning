# Meal Planning Website

A beautiful, minimalistic web application for planning meals and generating shopping lists.

## Features

### Stage 1: Configuration
- Set the number of meals you want to plan
- Choose between soups, main dishes, or both

### Stage 2: Recipe Selection
- **Smart Search**: Search recipes by name, type, tags, ingredients, and alternatives
- **Progress Tracking**: Visual progress bar showing selected servings vs. required servings
- **Expandable Recipe Cards**: View ingredients, instructions, and notes
- **Customizable Servings**: Adjust servings for each recipe before selection

### Stage 3: Shopping List
- **Intelligent Aggregation**: Automatically combines common ingredients across recipes
- **Scaled Quantities**: Adjusts ingredient quantities based on selected servings
- **Special Handling**: "olhómetro" units are displayed as "q.b." (quanto basta)
- **Export Options**: Share or download your shopping list for mobile use
- **Interactive Checklist**: Check off items as you shop

## Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Navigate to the project directory**:
   ```bash
   cd /Users/jpombal/Documents/meal-planning
   ```

2. **Create a virtual environment** (recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Flask server**:
   ```bash
   python app.py
   ```

2. **Open your browser** and navigate to:
   ```
   http://localhost:5000
   ```

3. **Start planning your meals!**

## Project Structure

```
meal-planning/
├── app.py                  # Flask backend
├── recipe_db.json          # Recipe database
├── requirements.txt        # Python dependencies
├── templates/
│   └── index.html         # Main HTML template
└── static/
    ├── style.css          # Styling with #ff8351 palette
    └── script.js          # Frontend logic
```

## Customization

### Adding New Recipes

Edit `recipe_db.json` and add recipes in the following format:

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
    "serves": 4,
    "tags": ["Tag1", "Tag2"]
}
```

### Customizing Colors

To change the color palette, edit the CSS variables in `static/style.css`:

```css
:root {
    --primary: #ff8351;        /* Main accent color */
    --primary-light: #ffb399;  /* Lighter variant */
    --primary-lighter: #ffe4d9; /* Lightest variant */
    --primary-dark: #e66a38;   /* Darker variant */
}
```

### Adjusting Search Behavior

The search algorithm is implemented in `app.py` in the `/api/recipes` endpoint. It searches across:
- Recipe name
- Recipe type
- Tags
- Ingredient names
- Ingredient alternatives

To modify search behavior, edit the `searchable_text` construction in `app.py:28-33`.

### Shopping List Aggregation

The shopping list logic is in `app.py` in the `/api/shopping-list` endpoint. Key features:
- Scales ingredient quantities based on servings
- Aggregates quantities with the same unit
- Handles "olhómetro" units specially
- Separates items that appear with both specific quantities and "olhómetro"

To modify this behavior, edit the logic in `app.py:41-124`.

## Features Explained

### Smart Search
The search is case-insensitive and performs partial matching across all recipe fields except instructions, notes, and serves count.

### Progress Bar
The progress bar calculates required servings based on:
- **Both soup and main**: meals × 2
- **Main only**: meals × 1
- **Soup only**: meals × 1

Selected servings increment the progress bar and unlock the "Finish Planning" button when target is reached.

### Shopping List Export
On mobile devices with Web Share API support, you can share the list directly to other apps (Notes, Reminders, etc.). On desktop, it downloads as a text file.

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers for on-the-go meal planning
- Web Share API support for enhanced mobile experience

## Tips

1. **Meal Planning**: Start with fewer meals to get familiar with the interface
2. **Search**: Use ingredient names or recipe types for quick filtering
3. **Servings**: Adjust servings before selecting to ensure accurate shopping list
4. **Shopping List**: Use the export feature to transfer the list to your phone's reminder app

## Troubleshooting

### Port Already in Use
If port 5000 is already in use, edit `app.py` and change the port:
```python
app.run(debug=True, port=5001)
```

### Recipes Not Loading
Ensure `recipe_db.json` is in the same directory as `app.py` and contains valid JSON.

### Styling Issues
Clear your browser cache or hard refresh (Ctrl+F5 / Cmd+Shift+R) to load the latest CSS.

## License

This project is open source and available for personal use.

## Acknowledgments

Built with clean, maintainable code using:
- Flask (Python backend)
- Vanilla JavaScript (no frameworks needed!)
- Modern CSS with beautiful animations
- Mobile-first responsive design
