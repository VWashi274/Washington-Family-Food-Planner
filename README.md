# Washington-Walker Family Food Planner

A beautifully designed React + Vite web app to help the Washington-Walker family plan weekly meals, discover recipes, and manage dietary preferences.

## ✨ Features

- **Weekly Meal Planning**: Assign meals to each day of the week with easy day selection
- **Protein Filtering**: Quick-select buttons to filter meals by protein type (Chicken, Beef, Shrimp, Salmon, Turkey, Vegetarian)
- **Meal Management**: 
  - Add new meals with categories, tags, and photos
  - Mark meals as favorites for quick access
  - Remove or edit existing meals
  - Upload meal images from your device
- **Recipe Editor**: Edit and save recipe notes directly in the app
- **Smart Filtering**: Filter meals by:
  - Favorites
  - Category
  - Protein type
  - Multiple filters work together
- **Pantry Check**: List ingredients you have on hand and get meal suggestions
- **AI-style Alternatives**: Get suggestions for alternative meals based on your needs
- **CSV Import**: Import meal data from CSV files (toggle on/off in settings)
- **Local Storage**: All plans save automatically in your browser
- **Weekly Preview**: View your complete meal plan for the week

## 🎨 Design

- Custom color palette: Warm cream (#F7E8B4) and brown (#5C4033)
- Typography: Playfair Display for headings, Poppins for body text
- Responsive layout with card-based UI
- Inspirational Bible verse display (Psalm 34:8)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd "Family Food App"

# Install dependencies
npm install

# Start the development server
npm run dev

# Open your browser to the URL shown (typically http://localhost:5173)
```

### Build for Production

```bash
npm run build
npm run preview
```

## 📊 Data Structure

### Meal Object
```typescript
{
  id: string;
  name: string;
  category: string;
  favorite: boolean;
  tags: string[];
  recipe?: string;
  image?: string;
  protein?: string;
  cuisine?: string;
  prep_time?: string;
  difficulty?: string;
  estimated_cost?: string;
  servings?: string;
}
```

### CSV Import Format

When importing meals from CSV, include these columns:

```
meal_name,protein,cuisine,category,prep_time,difficulty,estimated_cost,servings,ingredients,tags,family_favorite,Family Member
```

## 🔧 Settings

- **CSV Import Toggle**: Use the ⚙️ button in the header to show/hide the CSV import section

## 💾 Data Persistence

- Meal data is stored in browser localStorage
- Weekly schedule is automatically saved
- Pantry list is preserved between sessions

## 🛠️ Tech Stack

- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.0
- **Styling**: CSS with responsive design
- **Data Parsing**: PapaParse for CSV handling
- **State Management**: React hooks (useState, useMemo, useEffect)

## 📝 Project Structure

```
src/
├── App.tsx          # Main application component
├── main.tsx         # Entry point
├── styles.css       # Global styles
└── data/
    ├── meals.json   # Default meal data
    └── meals.csv    # Sample CSV format
```

## 🎯 Future Enhancements

- Ingredient lists and step-by-step recipe fields
- Grocery list and shopping planner
- Family member preferences and meal ratings
- Meal prep suggestions
- Nutritional information
- Recipe sharing and collaboration
- Mobile app version

## 📄 License

This project is for personal family use.

## 👥 Contributors

- Victoria Washington-Walker
- Family Team

## 📧 Support

For questions or issues, please reach out to the development team.
