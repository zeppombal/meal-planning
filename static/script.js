// Application State
let state = {
    mealCount: 7,
    mealType: 'both',
    requiredSoupServings: 0,
    requiredMainServings: 0,
    selectedRecipes: [],
    currentSoupServings: 0,
    currentMainServings: 0,
    allRecipes: []
};

// DOM Elements
const stage1 = document.getElementById('stage-1');
const stage2 = document.getElementById('stage-2');
const stage3 = document.getElementById('stage-3');
const mealCountInput = document.getElementById('meal-count');
const startPlanningBtn = document.getElementById('start-planning-btn');
const recipeSearch = document.getElementById('recipe-search');
const recipeList = document.getElementById('recipe-list');

// Progress bars - single
const singleProgressWrapper = document.getElementById('single-progress');
const progressText = document.getElementById('progress-text');
const progressFill = document.getElementById('progress-fill');

// Progress bars - dual
const dualProgressWrapper = document.getElementById('dual-progress');
const soupProgressText = document.getElementById('soup-progress-text');
const soupProgressFill = document.getElementById('soup-progress-fill');
const mainProgressText = document.getElementById('main-progress-text');
const mainProgressFill = document.getElementById('main-progress-fill');

// Buttons
const finishPlanningBtn = document.getElementById('finish-planning-btn');
const backToStage1Btn = document.getElementById('back-to-stage1-btn');
const backToStage2Btn = document.getElementById('back-to-stage2-btn');
const shoppingList = document.getElementById('shopping-list');
const exportListBtn = document.getElementById('export-list-btn');
const restartBtn = document.getElementById('restart-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    startPlanningBtn.addEventListener('click', startPlanning);
    recipeSearch.addEventListener('input', handleSearch);
    finishPlanningBtn.addEventListener('click', finishPlanning);
    backToStage1Btn.addEventListener('click', () => goBackToStage(1));
    backToStage2Btn.addEventListener('click', () => goBackToStage(2));
    exportListBtn.addEventListener('click', exportShoppingList);
    restartBtn.addEventListener('click', restart);

    // Update meal count
    mealCountInput.addEventListener('input', (e) => {
        state.mealCount = parseInt(e.target.value) || 1;
    });

    // Update meal type
    document.querySelectorAll('input[name="meal-type"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.mealType = e.target.value;
        });
    });
}

// Stage Transitions
function showStage(stageNumber) {
    [stage1, stage2, stage3].forEach((stage, index) => {
        stage.classList.toggle('active', index === stageNumber - 1);
    });
}

// Back Navigation
function goBackToStage(stageNumber) {
    showStage(stageNumber);

    // If going back to stage 1, reset all selections and progress
    if (stageNumber === 1) {
        state.selectedRecipes = [];
        state.currentSoupServings = 0;
        state.currentMainServings = 0;
        state.requiredSoupServings = 0;
        state.requiredMainServings = 0;
        recipeSearch.value = '';
    }

    // If going back to stage 2, refresh the recipe list with current selections
    if (stageNumber === 2) {
        const currentQuery = recipeSearch.value;
        loadRecipes(currentQuery);
    }
}

// Stage 1: Start Planning
async function startPlanning() {
    // Calculate required servings based on meal type
    if (state.mealType === 'both') {
        state.requiredSoupServings = state.mealCount;
        state.requiredMainServings = state.mealCount;

        // Show dual progress bars
        singleProgressWrapper.style.display = 'none';
        dualProgressWrapper.style.display = 'block';
    } else if (state.mealType === 'soup') {
        state.requiredSoupServings = state.mealCount;
        state.requiredMainServings = 0;

        // Show single progress bar
        singleProgressWrapper.style.display = 'block';
        dualProgressWrapper.style.display = 'none';
    } else { // main
        state.requiredSoupServings = 0;
        state.requiredMainServings = state.mealCount;

        // Show single progress bar
        singleProgressWrapper.style.display = 'block';
        dualProgressWrapper.style.display = 'none';
    }

    // Load recipes
    await loadRecipes();
    updateProgress();
    showStage(2);
}

// Load Recipes from API
async function loadRecipes(query = '') {
    try {
        let url = '/api/recipes';
        const params = new URLSearchParams();

        if (query) {
            params.append('q', query);
        }

        // Filter by type - but allow soups when "main only" is selected
        if (state.mealType === 'soup') {
            params.append('type', 'Soup');
        }
        // Note: We don't filter when mealType is 'main' or 'both'
        // This allows soups to appear in "main only" mode

        if (params.toString()) {
            url += '?' + params.toString();
        }

        const response = await fetch(url);
        const recipes = await response.json();
        state.allRecipes = recipes;
        renderRecipes(recipes);
    } catch (error) {
        console.error('Error loading recipes:', error);
        recipeList.innerHTML = '<div class="empty-state"><p>Error loading recipes. Please try again.</p></div>';
    }
}

// Render Recipes
function renderRecipes(recipes) {
    if (recipes.length === 0) {
        recipeList.innerHTML = '<div class="empty-state"><p>No recipes found. Try a different search.</p></div>';
        return;
    }

    recipeList.innerHTML = recipes.map((recipe, index) => {
        const isSelected = state.selectedRecipes.find(r => r.name === recipe.name);
        const selectedServings = isSelected ? isSelected.servings : recipe.serves;

        return `
            <div class="recipe-card" data-recipe-index="${index}">
                <div class="recipe-header" onclick="toggleRecipeDetails(${index})">
                    <div class="recipe-info">
                        <div class="recipe-name">${recipe.name}</div>
                        <div class="recipe-meta">
                            <span class="recipe-type">${recipe.type}</span>
                            <span>${recipe.serves} servings</span>
                        </div>
                    </div>
                    <div class="recipe-controls" onclick="event.stopPropagation()">
                        <input
                            type="number"
                            class="servings-input"
                            value="${selectedServings}"
                            min="1"
                            data-recipe-name="${recipe.name}"
                            id="servings-${index}"
                        >
                        <button
                            class="select-btn ${isSelected ? 'selected' : ''}"
                            onclick="toggleRecipeSelection('${recipe.name}', '${recipe.type}', ${index})"
                            id="select-btn-${index}"
                        >
                            ${isSelected ? 'Selected' : 'Select'}
                        </button>
                    </div>
                </div>
                <div class="recipe-details" id="details-${index}">
                    ${renderRecipeDetails(recipe)}
                </div>
            </div>
        `;
    }).join('');
}

// Render Recipe Details
function renderRecipeDetails(recipe) {
    let html = '';

    // Ingredients
    if (recipe.ingredients && recipe.ingredients.length > 0) {
        html += '<div class="recipe-section">';
        html += '<h3>Ingredients</h3>';
        html += '<ul class="ingredient-list">';
        recipe.ingredients.forEach(ing => {
            let displayText = ing.name;
            if (ing.unit === 'olhómetro') {
                displayText += ': q.b.';
            } else if (ing.quantity) {
                displayText += `: ${ing.quantity} ${ing.unit}`;
            }
            if (ing.alternatives && ing.alternatives.length > 0) {
                displayText += ` (alternatives: ${ing.alternatives.join(', ')})`;
            }
            html += `<li>${displayText}</li>`;
        });
        html += '</ul></div>';
    }

    // Instructions
    if (recipe.instructions && recipe.instructions.length > 0) {
        html += '<div class="recipe-section">';
        html += '<h3>Instructions</h3>';
        html += '<ol class="instruction-list">';
        recipe.instructions.forEach(instruction => {
            html += `<li>${instruction}</li>`;
        });
        html += '</ol></div>';
    }

    // Notes
    if (recipe.notes && recipe.notes.length > 0) {
        html += '<div class="recipe-section">';
        html += '<h3>Notes</h3>';
        html += '<ul class="note-list">';
        recipe.notes.forEach(note => {
            html += `<li>${note}</li>`;
        });
        html += '</ul></div>';
    }

    return html;
}

// Toggle Recipe Details
function toggleRecipeDetails(index) {
    const details = document.getElementById(`details-${index}`);
    details.classList.toggle('expanded');
}

// Toggle Recipe Selection
function toggleRecipeSelection(recipeName, recipeType, index) {
    const servingsInput = document.getElementById(`servings-${index}`);
    const servings = parseInt(servingsInput.value) || 1;
    const selectBtn = document.getElementById(`select-btn-${index}`);

    const existingIndex = state.selectedRecipes.findIndex(r => r.name === recipeName);

    if (existingIndex >= 0) {
        // Deselect
        state.selectedRecipes.splice(existingIndex, 1);
        selectBtn.textContent = 'Select';
        selectBtn.classList.remove('selected');
    } else {
        // Select
        state.selectedRecipes.push({
            name: recipeName,
            type: recipeType,
            servings: servings
        });
        selectBtn.textContent = 'Selected';
        selectBtn.classList.add('selected');
    }

    // Update servings count
    updateServingsCount();
    updateProgress();
}

// Update Servings Count
function updateServingsCount() {
    if (state.mealType === 'both') {
        // Count soup and main servings separately
        state.currentSoupServings = state.selectedRecipes
            .filter(r => r.type === 'Soup')
            .reduce((sum, recipe) => sum + recipe.servings, 0);

        state.currentMainServings = state.selectedRecipes
            .filter(r => r.type === 'Main')
            .reduce((sum, recipe) => sum + recipe.servings, 0);
    } else if (state.mealType === 'soup') {
        state.currentSoupServings = state.selectedRecipes
            .reduce((sum, recipe) => sum + recipe.servings, 0);
        state.currentMainServings = 0;
    } else { // main
        state.currentSoupServings = 0;
        state.currentMainServings = state.selectedRecipes
            .reduce((sum, recipe) => sum + recipe.servings, 0);
    }
}

// Update Progress Bar
function updateProgress() {
    if (state.mealType === 'both') {
        // Update dual progress bars
        const soupPercentage = Math.min((state.currentSoupServings / state.requiredSoupServings) * 100, 100);
        const mainPercentage = Math.min((state.currentMainServings / state.requiredMainServings) * 100, 100);

        soupProgressFill.style.width = `${soupPercentage}%`;
        mainProgressFill.style.width = `${mainPercentage}%`;

        soupProgressText.textContent = `Soup: ${state.currentSoupServings} / ${state.requiredSoupServings} servings`;
        mainProgressText.textContent = `Main: ${state.currentMainServings} / ${state.requiredMainServings} servings`;

        // Enable finish button only when both requirements are met
        if (state.currentSoupServings >= state.requiredSoupServings &&
            state.currentMainServings >= state.requiredMainServings) {
            finishPlanningBtn.disabled = false;
        } else {
            finishPlanningBtn.disabled = true;
        }
    } else {
        // Update single progress bar
        const totalRequired = state.mealType === 'soup' ? state.requiredSoupServings : state.requiredMainServings;
        const totalCurrent = state.mealType === 'soup' ? state.currentSoupServings : state.currentMainServings;

        const percentage = Math.min((totalCurrent / totalRequired) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `${totalCurrent} / ${totalRequired} servings selected`;

        // Enable/disable finish button
        if (totalCurrent >= totalRequired) {
            finishPlanningBtn.disabled = false;
        } else {
            finishPlanningBtn.disabled = true;
        }
    }
}

// Handle Search
let searchTimeout;
function handleSearch(e) {
    const query = e.target.value;

    // Debounce search
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadRecipes(query);
    }, 300);
}

// Finish Planning and Generate Shopping List
async function finishPlanning() {
    try {
        const response = await fetch('/api/shopping-list', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipes: state.selectedRecipes
            })
        });

        const shoppingItems = await response.json();
        renderShoppingList(shoppingItems);
        showStage(3);
    } catch (error) {
        console.error('Error generating shopping list:', error);
        alert('Error generating shopping list. Please try again.');
    }
}

// Render Shopping List
function renderShoppingList(items) {
    if (items.length === 0) {
        shoppingList.innerHTML = '<div class="empty-state"><p>No items in shopping list.</p></div>';
        return;
    }

    let itemIndex = 0;
    shoppingList.innerHTML = items.map(item => {
        // Render category header
        if (item.type === 'category') {
            return `<div class="category-header">${item.name}</div>`;
        }

        // Render shopping item
        const currentIndex = itemIndex++;
        return `
            <div class="shopping-item" id="shopping-item-${currentIndex}" data-item-name="${item.display}" data-item-recipes="${item.recipes}">
                <input
                    type="checkbox"
                    id="checkbox-${currentIndex}"
                    onchange="toggleShoppingItem(${currentIndex})"
                >
                <label for="checkbox-${currentIndex}" class="shopping-item-text">
                    ${item.display} <span class="recipe-sources">(${item.recipes})</span>
                </label>
            </div>
        `;
    }).join('');
}

// Toggle Shopping Item
function toggleShoppingItem(index) {
    const item = document.getElementById(`shopping-item-${index}`);
    const checkbox = document.getElementById(`checkbox-${index}`);

    if (checkbox.checked) {
        item.classList.add('checked');
    } else {
        item.classList.remove('checked');
    }
}

// Export Shopping List
function exportShoppingList() {
    // Build markdown content with categories
    let markdownContent = '# Shopping List\n\n';

    const categories = shoppingList.querySelectorAll('.category-header');

    categories.forEach(categoryHeader => {
        const categoryName = categoryHeader.textContent;
        markdownContent += `## ${categoryName}\n\n`;

        // Get all shopping items until next category
        let nextElement = categoryHeader.nextElementSibling;
        while (nextElement && !nextElement.classList.contains('category-header')) {
            if (nextElement.classList.contains('shopping-item')) {
                const itemName = nextElement.getAttribute('data-item-name');
                const itemRecipes = nextElement.getAttribute('data-item-recipes');
                markdownContent += `- [ ] ${itemName} *(${itemRecipes})*\n`;
            }
            nextElement = nextElement.nextElementSibling;
        }

        markdownContent += '\n';
    });

    // Try to use Web Share API (works on mobile)
    if (navigator.share) {
        navigator.share({
            title: 'Shopping List',
            text: markdownContent
        }).catch(() => {
            // Fallback to download if sharing fails
            downloadAsMarkdownFile(markdownContent);
        });
    } else {
        // Fallback to download
        downloadAsMarkdownFile(markdownContent);
    }
}

// Download as Markdown File
function downloadAsMarkdownFile(content) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Restart
function restart() {
    // Reset state
    state = {
        mealCount: 7,
        mealType: 'both',
        requiredSoupServings: 0,
        requiredMainServings: 0,
        selectedRecipes: [],
        currentSoupServings: 0,
        currentMainServings: 0,
        allRecipes: []
    };

    // Reset inputs
    mealCountInput.value = 7;
    document.querySelector('input[name="meal-type"][value="both"]').checked = true;
    recipeSearch.value = '';

    // Show first stage
    showStage(1);
}
