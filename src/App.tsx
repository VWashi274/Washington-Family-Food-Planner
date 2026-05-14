import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import Papa, { ParseResult } from 'papaparse';
import mealsData from './data/meals.json';

type Meal = {
  id: string;
  name: string;
  image?: string;
  category: string;
  favorite: boolean;
  tags: string[];
  recipe?: string;
  protein?: string;
  cuisine?: string;
  prep_time?: string;
  difficulty?: string;
  estimated_cost?: string;
  servings?: string;
  family_favorite?: string;
  family_member?: string;
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const storageKeyMeals = 'washington-walker-meals';
const storageKeySchedule = 'washington-walker-schedule';
const storageKeyPantry = 'washington-walker-pantry';

function loadMeals(): Meal[] {
  const stored = localStorage.getItem(storageKeyMeals);
  if (!stored) return mealsData as Meal[];

  try {
    const parsed = JSON.parse(stored) as Meal[];
    return Array.isArray(parsed) ? parsed : mealsData as Meal[];
  } catch {
    return mealsData as Meal[];
  }
}

function loadSchedule(): Record<string, string> {
  const stored = localStorage.getItem(storageKeySchedule);
  if (!stored) return {};

  try {
    const parsed = JSON.parse(stored) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function loadPantry(): string {
  return localStorage.getItem(storageKeyPantry) ?? '';
}

function generateAlternativeSuggestions(currentMeal: Meal | undefined, need: string, meals: Meal[]): Meal[] {
  if (!currentMeal) return [];

  const query = need.trim().toLowerCase();

  const matchingMeals = meals.filter((meal) => {
    if (meal.id === currentMeal.id) return false;
    if (!query) return false;

    return (
      meal.category.toLowerCase().includes(query) ||
      meal.tags.some((tag) => tag.toLowerCase().includes(query)) ||
      meal.name.toLowerCase().includes(query)
    );
  });

  if (matchingMeals.length > 0) {
    return matchingMeals.slice(0, 3);
  }

  const sameCategory = meals.filter((meal) => meal.id !== currentMeal.id && meal.category === currentMeal.category);
  if (sameCategory.length) {
    return sameCategory.slice(0, 3);
  }

  const sharedTags = meals.filter(
    (meal) =>
      meal.id !== currentMeal.id &&
      meal.tags.some((tag) => currentMeal.tags.includes(tag))
  );

  return sharedTags.length > 0 ? sharedTags.slice(0, 3) : meals.filter((meal) => meal.id !== currentMeal.id).slice(0, 3);
}

function generatePantrySuggestions(pantryText: string, meals: Meal[]): Meal[] {
  const pantryTerms = pantryText
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  if (pantryTerms.length === 0) return [];

  const suggestions = meals.filter((meal) =>
    meal.tags.some((tag) => pantryTerms.some((term) => tag.toLowerCase().includes(term))) ||
    pantryTerms.some((term) => meal.category.toLowerCase().includes(term)) ||
    pantryTerms.some((term) => meal.name.toLowerCase().includes(term))
  );

  return suggestions.slice(0, 4);
}

function App() {
  const [meals, setMeals] = useState<Meal[]>(() => loadMeals());
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);
  const [schedule, setSchedule] = useState<Record<string, string>>(() => loadSchedule());
  const [activeMealId, setActiveMealId] = useState<string>((mealsData as Meal[])[0].id);
  const [newMeal, setNewMeal] = useState('');
  const [newCategory, setNewCategory] = useState('Dinner');
  const [newTags, setNewTags] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [alternativeNeed, setAlternativeNeed] = useState('');
  const [suggestions, setSuggestions] = useState<Meal[]>([]);
  const [recipeDraft, setRecipeDraft] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [csvMessage, setCsvMessage] = useState('');
  const [selectedProtein, setSelectedProtein] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(true);
  const [pantryText, setPantryText] = useState(() => loadPantry());

  const activeMeal = meals.find((meal) => meal.id === activeMealId) ?? meals[0];
  const pantrySuggestions = useMemo(() => generatePantrySuggestions(pantryText, meals), [pantryText, meals]);

  useEffect(() => {
    localStorage.setItem(storageKeyMeals, JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem(storageKeySchedule, JSON.stringify(schedule));
  }, [schedule]);

  useEffect(() => {
    localStorage.setItem(storageKeyPantry, pantryText);
  }, [pantryText]);

  useEffect(() => {
    setRecipeDraft(activeMeal?.recipe ?? '');
  }, [activeMealId, activeMeal?.recipe]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(meals.map((meal) => meal.category)))],
    [meals]
  );

  const proteins = useMemo(
    () => ['All', ...Array.from(new Set(meals.map((meal) => meal.protein).filter(Boolean)))],
    [meals]
  );

  const availableMeals = useMemo(
    () =>
      meals.filter(
        (meal) =>
          (!showFavoritesOnly || meal.favorite) &&
          (categoryFilter === 'All' || meal.category === categoryFilter) &&
          (!selectedProtein || meal.protein === selectedProtein)
      ),
    [meals, showFavoritesOnly, categoryFilter, selectedProtein]
  );

  const filteredMeals = useMemo(
    () =>
      selectedProtein
        ? meals.filter((meal) => meal.protein === selectedProtein)
        : [],
    [meals, selectedProtein]
  );

  const assignMeal = (mealId: string) => {
    setSchedule((current) => ({ ...current, [selectedDay]: mealId }));
    setActiveMealId(mealId);
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !activeMeal) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setMeals((current) =>
          current.map((meal) =>
            meal.id === activeMeal.id ? { ...meal, image: result } : meal
          )
        );
        setSaveMessage('Image uploaded!');
        window.setTimeout(() => setSaveMessage(''), 2000);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleFavorite = (mealId: string) => {
    setMeals((current) =>
      current.map((meal) =>
        meal.id === mealId ? { ...meal, favorite: !meal.favorite } : meal
      )
    );
  };

  const removeMeal = (mealId: string) => {
    setMeals((current) => current.filter((meal) => meal.id !== mealId));
    setSchedule((current) => {
      const next = { ...current };
      Object.keys(next).forEach((day) => {
        if (next[day] === mealId) {
          delete next[day];
        }
      });
      return next;
    });
    if (activeMealId === mealId) {
      const nextMeal = meals.find((meal) => meal.id !== mealId);
      setActiveMealId(nextMeal?.id ?? '');
    }
  };

  const addMeal = () => {
    const trimmedName = newMeal.trim();
    if (!trimmedName) return;

    const newMealEntry: Meal = {
      id: `meal-${Date.now()}`,
      name: trimmedName,
      category: newCategory.trim() || 'Dinner',
      favorite: false,
      tags: newTags.split(',').map((tag) => tag.trim()).filter(Boolean),
      image: 'https://via.placeholder.com/360x220?text=New+Meal',
      recipe: '',
    };

    setMeals((current) => [...current, newMealEntry]);
    setNewMeal('');
    setNewTags('');
    setNewCategory('Dinner');
    setActiveMealId(newMealEntry.id);
  };

  const updateRecipe = () => {
    if (!activeMeal) return;
    setMeals((current) =>
      current.map((meal) =>
        meal.id === activeMeal.id ? { ...meal, recipe: recipeDraft } : meal
      )
    );
    setSaveMessage('Recipe saved!');
    window.setTimeout(() => setSaveMessage(''), 2000);
  };

  const handleCsvUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, string>>) => {
        const rows = results.data as Record<string, string>[];
        const importedMeals: Meal[] = rows.map((row, index) => {
          const name = row.meal_name?.trim() || `Imported Meal ${index + 1}`;
          const category = row.category?.trim() || 'Dinner';
          const favorite = String(row.family_favorite).trim().toLowerCase() === 'yes';
          const existingTags = String(row.tags).split(',').map(t => t.trim()).filter(Boolean);
          const additionalTags = [row.protein, row.cuisine, row.difficulty, row['Family Member']].filter(Boolean).map(t => t.trim());
          const tags = [...existingTags, ...additionalTags];
          const image = 'https://via.placeholder.com/360x220?text=' + encodeURIComponent(name);
          const recipe = row.ingredients?.trim() || '';

          return {
            id: `meal-csv-${Date.now()}-${index}`,
            name,
            category,
            favorite,
            tags,
            image,
            recipe,
            protein: row.protein?.trim() || '',
            cuisine: row.cuisine?.trim() || '',
            prep_time: row.prep_time?.trim() || '',
            difficulty: row.difficulty?.trim() || '',
            estimated_cost: row.estimated_cost?.trim() || '',
            servings: row.servings?.trim() || '',
            family_favorite: row.family_favorite?.trim() || '',
            family_member: row['Family Member']?.trim() || '',
          };
        });

        if (importedMeals.length === 0) {
          setCsvMessage('No meals found in the CSV file.');
          return;
        }

        setMeals((current) => [...current, ...importedMeals]);
        setCsvMessage(`Imported ${importedMeals.length} meals from CSV.`);
        window.setTimeout(() => setCsvMessage(''), 4000);
      },
      error: (error: Error) => {
        setCsvMessage(`CSV import failed: ${error.message}`);
      },
    });
  };

  const suggestAlternatives = () => {
    setSuggestions(generateAlternativeSuggestions(activeMeal, alternativeNeed, meals));
  };

  const mealNameForDay = (day: string) => {
    const mealId = schedule[day];
    return mealId ? meals.find((meal) => meal.id === mealId)?.name ?? '—' : '—';
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Washington-Walker Family Food Planner</h1>
        <p>Build a family-friendly weekly meal plan with recipes, uploads, pantry checks, and smart alternatives.</p>
        <button type="button" className="settings-button" onClick={() => setShowCsvImport(!showCsvImport)}>
          ⚙️ {showCsvImport ? 'Hide' : 'Show'} CSV Import
        </button>
      </header>

      <nav className="tabs">
        <button type="button">Home</button>
        <button type="button">Family Favorites</button>
        <button type="button">Recipe Book</button>
        <button type="button">Grocery List</button>
      </nav>

      <section className="verse-card">
        <p className="verse-text">
          "Taste and see that the Lord is good; blessed is the one who takes refuge in Him."
        </p>

        <p className="verse-reference">
          Psalm 34:8
        </p>
      </section>

      <section className="protein-section">
        <h2>Pick Your Protein</h2>

        <div className="protein-buttons">
          <button type="button" onClick={() => setSelectedProtein('Chicken')}>
            🍗 Chicken
          </button>

          <button type="button" onClick={() => setSelectedProtein('Shrimp')}>
            🍤 Shrimp
          </button>

          <button type="button" onClick={() => setSelectedProtein('Salmon')}>
            🐟 Salmon
          </button>

          <button type="button" onClick={() => setSelectedProtein('Turkey')}>
            🦃 Turkey
          </button>

          <button type="button" onClick={() => setSelectedProtein('Beef')}>
            🥩 Beef
          </button>

          <button type="button" onClick={() => setSelectedProtein('Vegetarian')}>
            🌱 Vegetarian
          </button>
        </div>

        <div className="meal-results">
          {filteredMeals.map((meal, index) => (
            <div className="meal-card" key={index}>
              <h3>{meal.name}</h3>

              <p>{meal.cuisine}</p>

              <p>
                {meal.prep_time} mins • {meal.difficulty}
              </p>

              <p>${meal.estimated_cost}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="planner-card">
        <div className="planner-left">
          <h2>Weekly Menu</h2>
          <div className="days-grid">
            {daysOfWeek.map((day) => (
              <button
                key={day}
                type="button"
                className={day === selectedDay ? 'day-button selected' : 'day-button'}
                onClick={() => setSelectedDay(day)}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="assignment-panel">
            <h3>{selectedDay}</h3>
            <p>Assigned meal:</p>
            <div className="assigned-meal">{mealNameForDay(selectedDay)}</div>

            <div className="filter-row">
              <label>
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(event) => setShowFavoritesOnly(event.target.checked)}
                />
                Show favorites only
              </label>
              <label>
                Category
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Protein
                <select value={selectedProtein} onChange={(event) => setSelectedProtein(event.target.value)}>
                  {proteins.map((protein) => (
                    <option key={protein} value={protein === 'All' ? '' : protein}>
                      {protein}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="pantry-panel">
              <h3>Pantry / What You May Need</h3>
              <textarea
                value={pantryText}
                onChange={(event) => setPantryText(event.target.value)}
                placeholder="List fridge and pantry items here, separated by commas or new lines."
              />
              <p className="hint">Use this to see which meals match what you already have on hand.</p>
              {pantrySuggestions.length > 0 && (
                <div className="suggestion-list">
                  <h4>Meals you can make now</h4>
                  {pantrySuggestions.map((meal) => (
                    <div key={meal.id} className="suggestion-item">
                      <span>{meal.name}</span>
                      <button type="button" className="secondary" onClick={() => setActiveMealId(meal.id)}>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="meal-list">
              {availableMeals.map((meal) => (
                <div key={meal.id} className="meal-card">
                  <button type="button" className="meal-select-button" onClick={() => assignMeal(meal.id)}>
                    <div>
                      <strong>{meal.name}</strong>
                      <div className="meal-tags">{meal.tags.join(' · ')}</div>
                      <div className="meal-category">{meal.category}</div>
                    </div>
                    <span className="assign-label">Assign</span>
                  </button>

                  <div className="meal-actions">
                    <button
                      type="button"
                      className={`icon-button ${meal.favorite ? 'active' : ''}`}
                      onClick={() => toggleFavorite(meal.id)}
                      aria-label={meal.favorite ? 'Remove favorite' : 'Mark favorite'}
                    >
                      ★
                    </button>
                    <button
                      type="button"
                      className="icon-button delete"
                      onClick={() => removeMeal(meal.id)}
                      aria-label="Remove meal"
                    >
                      🗑
                    </button>
                    <button
                      type="button"
                      className="icon-button details"
                      onClick={() => setActiveMealId(meal.id)}
                      aria-label="View meal details"
                    >
                      ℹ️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="secondary" onClick={() => setSchedule({})}>
              Clear weekly plan
            </button>
          </div>
        </div>

        <aside className="planner-right">
          <div className="add-meal-card">
            <h2>Add a New Meal</h2>
            <label>
              Meal name
              <input
                value={newMeal}
                onChange={(event) => setNewMeal(event.target.value)}
                placeholder="e.g. Sheet Pan Salmon"
              />
            </label>
            <label>
              Category
              <input
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                placeholder="Dinner"
              />
            </label>
            <label>
              Tags (comma-separated)
              <input
                value={newTags}
                onChange={(event) => setNewTags(event.target.value)}
                placeholder="Easy, Healthy, Kid-friendly"
              />
            </label>
            <button type="button" className="primary" onClick={addMeal}>
              Add meal
            </button>
          </div>

          {showCsvImport && (
            <div className="add-meal-card">
              <h2>Import Meals from CSV</h2>
              <label>
                Upload CSV file
                <input type="file" accept=".csv" onChange={handleCsvUpload} />
              </label>
              <p className="hint">CSV columns should include: id, name, category, favorite, tags, image, recipe.</p>
              {csvMessage && <p className="save-message">{csvMessage}</p>}
            </div>
          )}

          <div className="meal-detail-card">
            <div className="meal-detail-header">
              <div>
                <h2>{activeMeal?.name ?? 'Select a meal'}</h2>
                {activeMeal && (
                  <div className="meal-meta-row">
                    <span className="pill">{activeMeal.category}</span>
                    {activeMeal.favorite && <span className="pill favorite-pill">Favorite</span>}
                  </div>
                )}
              </div>
            </div>

            {activeMeal?.image && (
              <img className="meal-image" src={activeMeal.image} alt={activeMeal.name} />
            )}

            <div className="meal-detail-body">
              <label>
                Upload meal image
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </label>
              <label>
                Recipe notes
                <textarea
                  className="recipe-textarea"
                  value={recipeDraft}
                  onChange={(event) => setRecipeDraft(event.target.value)}
                  placeholder="Write your recipe here..."
                />
              </label>
              <button type="button" className="primary" onClick={updateRecipe}>
                Save recipe
              </button>
              {saveMessage && <p className="save-message">{saveMessage}</p>}
            </div>

            <div className="alternative-panel">
              <h3>AI-style Suggestions</h3>
              <p>Type a need like "vegetarian" or "quick" and get alternative meal ideas.</p>
              <div className="alternative-input-row">
                <input
                  value={alternativeNeed}
                  onChange={(event) => setAlternativeNeed(event.target.value)}
                  placeholder="Need an alternative for..."
                />
                <button type="button" className="secondary" onClick={suggestAlternatives}>
                  Suggest
                </button>
              </div>
              {suggestions.length > 0 && (
                <div className="suggestion-list">
                  {suggestions.map((meal) => (
                    <div key={meal.id} className="suggestion-item">
                      <span>{meal.name}</span>
                      <button type="button" className="secondary" onClick={() => setActiveMealId(meal.id)}>
                        View
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="schedule-preview">
              <h3>Plan Preview</h3>
              <ul>
                {daysOfWeek.map((day) => (
                  <li key={day}>
                    <strong>{day}:</strong> {mealNameForDay(day)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

export default App;

