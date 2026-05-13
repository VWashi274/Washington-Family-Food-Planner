import { ChangeEvent, useEffect, useMemo, useState } from 'react';

type Meal = {
  id: string;
  name: string;
  image?: string;
  category: string;
  favorite: boolean;
  tags: string[];
  recipe?: string;
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const storageKeyMeals = 'washington-walker-meals';
const storageKeySchedule = 'washington-walker-schedule';
const storageKeyPantry = 'washington-walker-pantry';

const initialMeals: Meal[] = [
  {
    id: 'meal-1',
    name: 'Baked Chicken with Veggies',
    category: 'Dinner',
    favorite: true,
    tags: ['Family favorite', 'Easy'],
    image: 'https://via.placeholder.com/360x220?text=Baked+Chicken',
    recipe: 'Roast chicken with mixed vegetables, garlic, and herbs. Serve with a side salad.',
  },
  {
    id: 'meal-2',
    name: 'Spaghetti and Meatballs',
    category: 'Comfort',
    favorite: true,
    tags: ['Comfort', 'Quick'],
    image: 'https://via.placeholder.com/360x220?text=Spaghetti',
    recipe: 'Prepare meatballs, simmer in tomato sauce, and serve over spaghetti with parmesan.',
  },
  {
    id: 'meal-3',
    name: 'Taco Night',
    category: 'Fun',
    favorite: false,
    tags: ['Fun', 'Build your own'],
    image: 'https://via.placeholder.com/360x220?text=Tacos',
    recipe: 'Set out tortillas, seasoned meat or beans, and toppings for a family taco bar.',
  },
  {
    id: 'meal-4',
    name: 'Vegetable Stir Fry',
    category: 'Vegetarian',
    favorite: false,
    tags: ['Healthy', 'Vegetarian'],
    image: 'https://via.placeholder.com/360x220?text=Stir+Fry',
    recipe: 'Stir fry colorful vegetables with a savory sauce and serve over rice or noodles.',
  },
];

function loadMeals(): Meal[] {
  const stored = localStorage.getItem(storageKeyMeals);
  if (!stored) return initialMeals;

  try {
    const parsed = JSON.parse(stored) as Meal[];
    return Array.isArray(parsed) ? parsed : initialMeals;
  } catch {
    return initialMeals;
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
  const [activeMealId, setActiveMealId] = useState<string>(initialMeals[0].id);
  const [newMeal, setNewMeal] = useState('');
  const [newCategory, setNewCategory] = useState('Dinner');
  const [newTags, setNewTags] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [alternativeNeed, setAlternativeNeed] = useState('');
  const [suggestions, setSuggestions] = useState<Meal[]>([]);
  const [recipeDraft, setRecipeDraft] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
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

  const availableMeals = useMemo(
    () =>
      meals.filter(
        (meal) =>
          (!showFavoritesOnly || meal.favorite) &&
          (categoryFilter === 'All' || meal.category === categoryFilter)
      ),
    [meals, showFavoritesOnly, categoryFilter]
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
      </header>

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

