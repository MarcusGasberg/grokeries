# Feature: Smart Grocery Autocomplete with Multi-Language Support

## Prerequisites
1. User has access to the grocery list page
2. Browser supports modern input events and autocomplete
3. User's language preference is detected or configured

## Purpose
Provide intelligent, fast autocomplete suggestions for grocery items that learn from both global database patterns and personal user history, with multi-language support to serve international users efficiently.

## Current State Analysis

### Existing Implementation:
- **Input field**: src/routes/_layout/groceries/index.tsx:411-416
  - Simple text input with placeholder "ADD ITEM..."
  - No autocomplete currently
  - Uppercase styling, brutalist design
- **Form validation**: src/shared/grocery.form.ts
  - Name: min 1 character (no max)
  - No normalization or deduplication
- **Zero sync**: Already configured for real-time updates
- **Categories**: 9 predefined categories (produce, dairy, meat, etc.)

### Gaps Identified:
1. ❌ No autocomplete/suggestions
2. ❌ No learning from user history
3. ❌ No global item database
4. ❌ Duplicate items with slight variations (e.g., "Milk" vs "milk" vs "MILK")
5. ❌ No multi-language support
6. ❌ No category inference from item name

## Technical Approach

### Database Architecture

#### 1. Global Items Table (`globalGroceryItems`)
**Purpose**: Curated, crowdsourced database of common grocery items across languages

```typescript
export const globalGroceryItems = pgTable("global_grocery_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // Canonical name (e.g., "Milk")
  nameNormalized: text("name_normalized").notNull(), // Lowercase, trimmed for matching
  language: text("language").notNull(), // ISO 639-1 code (en, es, fr, etc.)
  category: groceryCategory("category").notNull(),
  usageCount: integer("usage_count").notNull().default(0), // Popularity score
  translations: jsonb("translations"), // { es: "Leche", fr: "Lait", de: "Milch" }
  aliases: jsonb("aliases").default([]), // Alternative names: ["whole milk", "2% milk"]
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

// Indexes for fast lookups
CREATE INDEX idx_global_items_lang_norm ON global_grocery_items(language, name_normalized);
CREATE INDEX idx_global_items_lang_usage ON global_grocery_items(language, usage_count DESC);
CREATE INDEX idx_global_items_category ON global_grocery_items(language, category);
```

#### 2. Personal Items Table (`userGroceryHistory`)
**Purpose**: Track each user's personal vocabulary and preferences

```typescript
export const userGroceryHistory = pgTable("user_grocery_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // User's exact input
  nameNormalized: text("name_normalized").notNull(),
  category: groceryCategory("category").notNull(),
  language: text("language").notNull(),
  usageCount: integer("usage_count").notNull().default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  globalItemId: text("global_item_id").references(() => globalGroceryItems.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Indexes for user-specific autocomplete
CREATE INDEX idx_user_history_user_norm ON user_grocery_history(user_id, name_normalized);
CREATE INDEX idx_user_history_user_usage ON user_grocery_history(user_id, usage_count DESC, last_used_at DESC);
```

#### 3. Autocomplete Cache Table (Zero-synced)
**Purpose**: Pre-computed, language-specific suggestions synced to client

```typescript
export const groceryAutocomplete = pgTable("grocery_autocomplete", {
  id: text("id").primaryKey(),
  language: text("language").notNull(),
  prefix: text("prefix").notNull(), // First 2-3 chars for efficient filtering
  suggestions: jsonb("suggestions").notNull(), // Array of top 10 suggestions
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Suggestions format:
type AutocompleteSuggestion = {
  name: string;
  category: GroceryCategory;
  source: 'global' | 'personal' | 'recent';
  score: number; // Relevance score
  globalItemId?: string;
};

// Indexes
CREATE INDEX idx_autocomplete_lang_prefix ON grocery_autocomplete(language, prefix);
```

### Zero Sync Strategy

**Selective Language Sync**: Only sync autocomplete data for user's language(s)

```typescript
// In zero-schema.ts
export const autocompleteQuery = (language: string) =>
  zero.query.groceryAutocomplete
    .where('language', '=', language)
    .limit(1000); // Limit to top 1000 prefixes

// Preload on app init (in zero-init.tsx)
const userLanguage = navigator.language.split('-')[0]; // 'en' from 'en-US'
zero.query.groceryAutocomplete
  .where('language', '=', userLanguage)
  .preload({ ttl: '10m' });
```

**Hybrid Approach**: Combine local cache + server fallback
- **Local**: Zero-synced autocomplete cache (instant)
- **Server**: Real-time query for new/rare items (fallback)
- **Personal**: Local-first user history (highest priority)

### Autocomplete Algorithm

**Priority Ranking**:
1. **Exact user history matches** (100 points)
2. **Recent user items** (last 30 days, 80 points)
3. **Frequent user items** (usage count, 60 points)
4. **Global popular items** (usage count, 40 points)
5. **Category-based suggestions** (20 points)

**Scoring Formula**:
```typescript
score =
  (userExactMatch ? 100 : 0) +
  (userRecentBonus * 20) +
  (userUsageCount * 5) +
  (globalUsageCount * 0.01) +
  (sameCategoryBonus * 10) +
  (prefixMatchLength * 2);
```

## Use Cases

### 1. Basic Autocomplete
**As a user**, when I start typing a grocery item name, I should see intelligent suggestions.

**Behavior:**
- User focuses on "ADD ITEM..." input field
- User types "mi" → Dropdown shows:
  ```
  🥛 Milk (you bought 15 times)
  🍞 Miniature bagels
  🥬 Mint leaves
  🧼 Mineral water
  📦 Mixed nuts (popular)
  ```
- Suggestions appear after 2 characters
- Max 8 suggestions shown
- Icon indicates category
- Badge shows "you bought X times" or "popular"
- Keyboard navigation: ↑↓ to select, Enter to confirm, Esc to dismiss
- Click to select suggestion

**Acceptance Criteria:**
- [ ] Dropdown appears after typing 2+ characters
- [ ] Shows max 8 suggestions sorted by relevance
- [ ] Displays category icon for each suggestion
- [ ] Shows usage hints (personal history vs popular)
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Click-to-select works
- [ ] Dropdown positioned below input (absolute/portal)
- [ ] Brutalist styling matches app theme
- [ ] <300ms response time (local-first)

### 2. Multi-Language Support
**As a user**, I should see suggestions in my preferred language.

**Behavior:**
- Detect language from browser: `navigator.language` → "en-US" → "en"
- Override via settings: User can select language manually
- Zero syncs only relevant language autocomplete data
- Typing "lei" in Portuguese shows "Leite" (milk)
- Typing "mil" in English shows "Milk"
- Typing "mæl" in Danish shows "Mælk" (milk)
- Fallback to English if user's language not supported
- Support initially: English (en), Spanish (es), French (fr), German (de), Portuguese (pt), Danish (da)

**Acceptance Criteria:**
- [ ] Detect browser language on first load
- [ ] Store language preference in user settings
- [ ] Zero query filters by language
- [ ] Preload only user's language data
- [ ] Show suggestions in correct language
- [ ] Fallback to English if unsupported language
- [ ] Display language selector in settings (Phase 2)

### 3. Personal Learning
**As a user**, the app should learn my personal grocery vocabulary over time.

**Behavior:**
- User adds "Organic 2% Milk" → Store in `userGroceryHistory`
- Next time typing "org" → "Organic 2% Milk" appears first
- Track usage count: User adds "Bananas" 10 times → Bananas ranks higher
- Recent items prioritized: Last 30 days boosted in ranking
- User-specific aliases: User calls it "Coke" but global DB says "Coca-Cola"
- Personal suggestions marked with "★" icon or "YOUR ITEM" badge

**Acceptance Criteria:**
- [ ] Save every added item to user history
- [ ] Increment usage count on repeat additions
- [ ] Update `lastUsedAt` timestamp
- [ ] Boost recent items (30-day window)
- [ ] Show personal items above global suggestions
- [ ] Display "★" or badge for personal items
- [ ] Handle spelling variations gracefully

### 4. Category Inference
**As a user**, when I select an autocomplete suggestion, the category should auto-populate.

**Behavior:**
- User types "mi" → selects "Milk"
- Category automatically set to "🥛 Dairy"
- User can override category if needed
- If uncertain, default to last-used category for that item
- New items with no history default to "📦 Other"

**Acceptance Criteria:**
- [ ] Auto-set category on suggestion selection
- [ ] Use global item category if available
- [ ] Fall back to user's personal history
- [ ] Default to "Other" for unknown items
- [ ] Allow manual category override
- [ ] Show category in suggestion dropdown

### 5. Duplicate Prevention
**As a user**, I should be warned if I'm adding a duplicate item.

**Behavior:**
- User types "Milk" → Autocomplete shows "Milk (already in list)"
- Duplicate items grayed out in dropdown
- On submit: Show toast "MILK IS ALREADY IN YOUR LIST"
- Option to increase quantity instead: "ADD TO EXISTING ITEM?"
- Normalization: "MILK" = "milk" = "Milk" (case-insensitive)

**Acceptance Criteria:**
- [ ] Detect duplicates via normalized name
- [ ] Gray out existing items in dropdown
- [ ] Show "(already in list)" badge
- [ ] Prevent duplicate addition with toast
- [ ] Offer to increment quantity instead
- [ ] Case-insensitive matching

### 6. Offline Support
**As a user**, autocomplete should work offline using cached data.

**Behavior:**
- Zero syncs autocomplete cache to IndexedDB
- Offline: Use only local cache (no server queries)
- Show "OFFLINE" indicator if limited suggestions
- When online: Sync new items to server
- User history stored locally, syncs when back online

**Acceptance Criteria:**
- [ ] Autocomplete works offline with cached data
- [ ] Show offline indicator if needed
- [ ] Queue new items for sync when back online
- [ ] User history persists locally
- [ ] No errors when offline

### 7. Initialize Global Database from External Sources
**As a system**, I should be able to automatically import and seed grocery data from multiple sources.

#### Import Strategy Overview

**Multiple Data Sources (Prioritized):**

1. **OpenFoodFacts API** (Primary Source)
   - Open database of food products worldwide
   - API: https://world.openfoodfacts.org/api/v2/search
   - Contains product names in multiple languages
   - ~2.8 million products with categories
   - Free, CC BY-SA 3.0 license

2. **Wikidata SPARQL** (Secondary Source)
   - Structured knowledge from Wikipedia
   - Query common food items via SPARQL
   - Multilingual labels automatically available
   - Example query for food items: `SELECT ?item ?itemLabel WHERE { ?item wdt:P31/wdt:P279* wd:Q2095 }`

3. **Manual CSV Seeds** (Curated Top 100 per Language)
   - Hand-curated most common items
   - Quality-checked translations
   - Backup/supplement for gaps

4. **User Contribution** (Long-term)
   - Crowdsourced from actual app usage
   - Verified by usage count threshold
   - Community voting on translations

#### Implementation

**Behavior:**

**Phase 1: OpenFoodFacts Import**
- Endpoint: `POST /api/admin/import/openfoodfacts`
- Query OpenFoodFacts for top products by category
- Filter by language codes: en, es, fr, de, pt, da
- Extract: product name, category, language
- Auto-categorize using keywords mapping
- Set initial `usageCount` based on product popularity score
- Limit to top 1000 items per language

**Phase 2: Wikidata Enhancement**
- Endpoint: `POST /api/admin/import/wikidata`
- SPARQL query for food/grocery items
- Extract multilingual labels (automatic translations)
- Enrich existing items with missing translations
- Add items not found in OpenFoodFacts

**Phase 3: Manual CSV Upload**
- Endpoint: `POST /api/admin/seed-csv`
- Upload CSV with columns: name, category, language, translations, aliases
- Bulk import curated items
- Override/supplement API data

**CSV Format Example**:
```csv
name,category,language,translations,aliases,usageCount
Milk,dairy,en,"{""es"":""Leche"",""fr"":""Lait"",""de"":""Milch"",""pt"":""Leite"",""da"":""Mælk""}","[""whole milk"",""2% milk"",""skim milk""]",1000
Bread,bakery,en,"{""es"":""Pan"",""fr"":""Pain"",""de"":""Brot"",""pt"":""Pão"",""da"":""Brød""}","[""white bread"",""wheat bread""]",950
Eggs,dairy,en,"{""es"":""Huevos"",""fr"":""Œufs"",""de"":""Eier"",""pt"":""Ovos"",""da"":""Æg""}","[""dozen eggs""]",900
Bananas,produce,en,"{""es"":""Plátanos"",""fr"":""Bananes"",""de"":""Bananen"",""pt"":""Bananas"",""da"":""Bananer""}","[""banana""]",850
Chicken,meat,en,"{""es"":""Pollo"",""fr"":""Poulet"",""de"":""Hähnchen"",""pt"":""Frango"",""da"":""Kylling""}","[""chicken breast""]",800
```

**OpenFoodFacts Integration Example**:
```typescript
// Import script: src/scripts/import-openfoodfacts.ts
import axios from 'axios';

async function importFromOpenFoodFacts(language: string) {
  const categories = ['dairy', 'produce', 'meat', 'bakery', 'frozen', 'pantry', 'beverages', 'household'];

  for (const category of categories) {
    const response = await axios.get('https://world.openfoodfacts.org/api/v2/search', {
      params: {
        categories_tags: mapCategoryToOFF(category),
        fields: 'product_name,categories,popularity_key,generic_name_' + language,
        page_size: 200,
        page: 1,
        sort_by: 'unique_scans_n',
        lc: language // Language code
      }
    });

    for (const product of response.data.products) {
      const name = product[`generic_name_${language}`] || product.product_name;
      if (!name) continue;

      await db.insert(globalGroceryItems).values({
        id: nanoid(),
        name: cleanProductName(name),
        nameNormalized: name.toLowerCase().trim(),
        language,
        category: inferCategory(product.categories),
        usageCount: product.unique_scans_n || 0,
        createdAt: new Date(),
      }).onConflictDoNothing(); // Skip if exists
    }
  }
}

function mapCategoryToOFF(category: string): string {
  const mapping = {
    dairy: 'en:dairies',
    produce: 'en:plant-based-foods',
    meat: 'en:meats',
    bakery: 'en:breads',
    frozen: 'en:frozen-foods',
    pantry: 'en:groceries',
    beverages: 'en:beverages',
    household: 'en:household-products',
  };
  return mapping[category] || 'en:groceries';
}
```

**Wikidata SPARQL Integration Example**:
```typescript
// Import script: src/scripts/import-wikidata.ts
import axios from 'axios';

async function importFromWikidata() {
  const sparqlQuery = `
    SELECT ?item ?itemLabel ?itemLabel_en ?itemLabel_es ?itemLabel_fr ?itemLabel_de ?itemLabel_pt ?itemLabel_da
    WHERE {
      ?item wdt:P31/wdt:P279* wd:Q2095.  # Instance of food
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en,es,fr,de,pt,da".
        ?item rdfs:label ?itemLabel.
        ?item rdfs:label ?itemLabel_en. FILTER(LANG(?itemLabel_en) = "en")
        ?item rdfs:label ?itemLabel_es. FILTER(LANG(?itemLabel_es) = "es")
        ?item rdfs:label ?itemLabel_fr. FILTER(LANG(?itemLabel_fr) = "fr")
        ?item rdfs:label ?itemLabel_de. FILTER(LANG(?itemLabel_de) = "de")
        ?item rdfs:label ?itemLabel_pt. FILTER(LANG(?itemLabel_pt) = "pt")
        ?item rdfs:label ?itemLabel_da. FILTER(LANG(?itemLabel_da) = "da")
      }
    }
    LIMIT 1000
  `;

  const response = await axios.get('https://query.wikidata.org/sparql', {
    params: { query: sparqlQuery, format: 'json' }
  });

  for (const result of response.data.results.bindings) {
    const translations = {
      es: result.itemLabel_es?.value,
      fr: result.itemLabel_fr?.value,
      de: result.itemLabel_de?.value,
      pt: result.itemLabel_pt?.value,
      da: result.itemLabel_da?.value,
    };

    const englishName = result.itemLabel_en?.value;
    if (!englishName) continue;

    await db.insert(globalGroceryItems).values({
      id: nanoid(),
      name: englishName,
      nameNormalized: englishName.toLowerCase().trim(),
      language: 'en',
      category: inferCategoryFromName(englishName),
      translations,
      usageCount: 100, // Default for Wikidata items
      createdAt: new Date(),
    });

    // Also create entries for each translation
    for (const [lang, translation] of Object.entries(translations)) {
      if (translation) {
        await db.insert(globalGroceryItems).values({
          id: nanoid(),
          name: translation,
          nameNormalized: translation.toLowerCase().trim(),
          language: lang,
          category: inferCategoryFromName(englishName),
          translations: { en: englishName },
          usageCount: 100,
          createdAt: new Date(),
        }).onConflictDoNothing();
      }
    }
  }
}
```

**Category Inference Logic**:
```typescript
function inferCategoryFromName(name: string): GroceryCategory {
  const lowerName = name.toLowerCase();

  const categoryKeywords = {
    dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'leche', 'lait', 'milch', 'leite', 'mælk'],
    produce: ['apple', 'banana', 'lettuce', 'tomato', 'carrot', 'fruit', 'vegetable', 'manzana', 'pomme'],
    meat: ['chicken', 'beef', 'pork', 'fish', 'turkey', 'pollo', 'poulet', 'carne', 'kylling'],
    bakery: ['bread', 'bagel', 'muffin', 'pastry', 'pan', 'pain', 'brot', 'pão', 'brød'],
    frozen: ['frozen', 'ice cream', 'congelado', 'surgelé', 'tiefgekühlt', 'congelado', 'frosset'],
    pantry: ['rice', 'pasta', 'flour', 'sugar', 'oil', 'arroz', 'riz', 'reis', 'arroz', 'ris'],
    beverages: ['juice', 'soda', 'water', 'coffee', 'tea', 'jugo', 'jus', 'saft', 'suco', 'juice'],
    household: ['soap', 'detergent', 'cleaner', 'paper', 'jabón', 'savon', 'seife', 'sabão', 'sæbe'],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category as GroceryCategory;
    }
  }

  return 'other';
}
```

**Acceptance Criteria:**
- [ ] OpenFoodFacts import script with rate limiting
- [ ] Wikidata SPARQL query for multilingual food items
- [ ] CSV upload endpoint (admin-only, with auth)
- [ ] Validate CSV format (schema validation)
- [ ] Bulk insert with transaction (rollback on error)
- [ ] Auto-generate normalized names (lowercase, trim)
- [ ] Set initial usage counts from source data
- [ ] Handle duplicates gracefully (skip or merge)
- [ ] Log import results (success/skipped/errors)
- [ ] Category inference from keywords
- [ ] CLI command for running imports: `bun run import-data --source=openfoodfacts --lang=en`
- [ ] Dry-run mode to preview imports
- [ ] Progress reporting during long imports
- [ ] Support for incremental updates (only new items)

---

## i18n Integration with i18next

### Overview
Since we're implementing multi-language support for grocery items, we should also internationalize the entire app UI using **i18next** for consistency.

### Setup

**Dependencies:**
```bash
bun add i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

**Configuration** (`src/lib/i18n.ts`):
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend) // Load translations from /public/locales
  .use(LanguageDetector) // Detect language from browser
  .use(initReactI18next) // Bind to React
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'pt', 'da'],
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React already escapes
    },

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator'],
      caches: ['localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupCookie: 'i18next',
      lookupLocalStorage: 'i18nextLng',
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### Translation Files Structure

```
public/locales/
├── en/
│   ├── common.json
│   ├── groceries.json
│   └── auth.json
├── es/
│   ├── common.json
│   ├── groceries.json
│   └── auth.json
├── fr/
│   ├── common.json
│   ├── groceries.json
│   └── auth.json
├── de/
│   ├── common.json
│   ├── groceries.json
│   └── auth.json
├── pt/
│   ├── common.json
│   ├── groceries.json
│   └── auth.json
└── da/
    ├── common.json
    ├── groceries.json
    └── auth.json
```

### Example Translation Files

**`public/locales/en/common.json`:**
```json
{
  "app": {
    "name": "GROKERIES",
    "tagline": "EFFICIENT SHOPPING"
  },
  "nav": {
    "groceries": "GROCERIES",
    "shopping": "SHOPPING",
    "settings": "SETTINGS"
  },
  "actions": {
    "add": "ADD",
    "delete": "DELETE",
    "edit": "EDIT",
    "save": "SAVE",
    "cancel": "CANCEL",
    "confirm": "CONFIRM"
  }
}
```

**`public/locales/en/groceries.json`:**
```json
{
  "list": {
    "empty": "EMPTY LIST",
    "emptyDescription": "ADD ITEMS TO DOMINATE",
    "progress": "PROGRESS",
    "completed": "{{completed}}/{{total}}"
  },
  "form": {
    "placeholder": "ADD ITEM...",
    "quantity": "QTY",
    "addButton": "DESTROY HUNGER",
    "categories": {
      "produce": "🥬 Produce",
      "dairy": "🥛 Dairy",
      "meat": "🥩 Meat",
      "pantry": "🥫 Pantry",
      "bakery": "🍞 Bakery",
      "frozen": "🧊 Frozen",
      "beverages": "🍹 Beverages",
      "household": "🧼 Household",
      "other": "📦 Other"
    }
  },
  "autocomplete": {
    "personal": "★ YOU BOUGHT THIS {{count}}X",
    "popular": "POPULAR",
    "alreadyInList": "(ALREADY IN LIST)",
    "noResults": "NO SUGGESTIONS",
    "loading": "LOADING..."
  },
  "shopping": {
    "startButton": "START SHOPPING",
    "finishButton": "FINISH SHOPPING",
    "exitButton": "EXIT SHOPPING MODE",
    "completed": "SHOPPING COMPLETE!",
    "achievement": "GROCERY DOMINATION ACHIEVED"
  },
  "menu": {
    "createList": "CREATE LIST",
    "inviteUser": "INVITE USER",
    "collaborators": "COLLABORATORS",
    "shareList": "SHARE LIST",
    "settings": "SETTINGS",
    "deleteList": "DELETE LIST",
    "logout": "LOGOUT"
  }
}
```

**`public/locales/da/groceries.json`:**
```json
{
  "list": {
    "empty": "TOM LISTE",
    "emptyDescription": "TILFØJ VARER FOR AT DOMINERE",
    "progress": "FREMSKRIDT",
    "completed": "{{completed}}/{{total}}"
  },
  "form": {
    "placeholder": "TILFØJ VARE...",
    "quantity": "ANTAL",
    "addButton": "TILINTETGØR SULT",
    "categories": {
      "produce": "🥬 Grøntsager",
      "dairy": "🥛 Mejeriprodukter",
      "meat": "🥩 Kød",
      "pantry": "🥫 Forråd",
      "bakery": "🍞 Bagværk",
      "frozen": "🧊 Frosne varer",
      "beverages": "🍹 Drikkevarer",
      "household": "🧼 Husholdning",
      "other": "📦 Andet"
    }
  },
  "autocomplete": {
    "personal": "★ DU KØBTE DETTE {{count}}X",
    "popular": "POPULÆR",
    "alreadyInList": "(ALLEREDE PÅ LISTEN)",
    "noResults": "INGEN FORSLAG",
    "loading": "INDLÆSER..."
  },
  "shopping": {
    "startButton": "START INDKØB",
    "finishButton": "AFSLUT INDKØB",
    "exitButton": "FORLAD INDKØBSTILSTAND",
    "completed": "INDKØB FULDFØRT!",
    "achievement": "INDKØBSDOMINANS OPNÅET"
  },
  "menu": {
    "createList": "OPRET LISTE",
    "inviteUser": "INVITER BRUGER",
    "collaborators": "SAMARBEJDSPARTNERE",
    "shareList": "DEL LISTE",
    "settings": "INDSTILLINGER",
    "deleteList": "SLET LISTE",
    "logout": "LOG UD"
  }
}
```

### Usage in Components

**Update groceries page** (`src/routes/_layout/groceries/index.tsx`):
```typescript
import { useTranslation } from 'react-i18next';

function RouteComponent() {
  const { t } = useTranslation(['groceries', 'common']);

  // ... existing code

  return (
    <div className="min-h-screen bg-background p-4 max-w-md md:max-w-3xl mx-auto">
      <div className="mb-8 pt-6">
        <div className="bg-primary text-primary-foreground py-4 px-6 border-4 border-primary shadow-[8px_8px_0px_0px_var(--ring)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="p-2 bg-accent border-2 border-accent-foreground flex-shrink-0">
                <ShoppingCart className="w-8 h-8 text-accent-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl md:text-3xl font-black font-sans tracking-tight uppercase truncate">
                  {user?.name ?? ""}' {t('app.name', { ns: 'common' })}
                </h1>
                <p className="text-xs md:text-sm font-bold font-serif uppercase tracking-wide">
                  {t('app.tagline', { ns: 'common' })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {totalCount > 0 && completedCount !== totalCount && (
          <>
            <div className="mt-6 p-4 bg-accent text-accent-foreground border-4 border-accent shadow-[4px_4px_0px_0px_var(--primary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black font-sans uppercase tracking-wide">
                  {t('list.progress')}
                </span>
                <span className="text-lg font-black font-mono">
                  {t('list.completed', { completed: completedCount, total: totalCount })}
                </span>
              </div>
              {/* Progress bar... */}
            </div>
            <Button
              size="lg"
              onClick={() => router.navigate({ to: "/groceries/shopping", search: { listId: selectedListId } })}
              className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white font-black font-sans uppercase tracking-wide text-lg border-4 border-green-700 shadow-[6px_6px_0px_0px_var(--ring)] hover:shadow-[3px_3px_0px_0px_var(--ring)] transition-all relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <ShoppingCart className="w-6 h-6" />
                {t('shopping.startButton')}
              </span>
            </Button>
          </>
        )}
      </div>

      {/* Form Card */}
      <Card id="grocery-form-card" className="mb-6 border-4 border-primary shadow-[6px_6px_0px_0px_var(--ring)]">
        <CardContent className="py-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(addItem)} className="space-y-4">
              <div className="flex gap-2">
                <FormField
                  {...form.register("name")}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          id="name-field"
                          placeholder={t('form.placeholder')}
                          {...field}
                          className="flex-1 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  {...form.register("quantity")}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder={t('form.quantity')}
                          {...field}
                          className="w-20 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Category Buttons */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.value}
                    type="button"
                    variant={selectedCategory === category.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => form.setValue("category", category.value)}
                    className={/* ... */}
                  >
                    {t(`form.categories.${category.value}`)}
                  </Button>
                ))}
              </div>

              <Button type="submit" className="w-full..." disabled={!form.formState.isValid}>
                <Plus className="w-5 h-5 mr-2" />
                {t('form.addButton')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Empty State */}
      {groceries.length === 0 && (
        <Card className="border-4 border-dashed border-muted-foreground col-span-full">
          <CardContent className="p-8 text-center">
            <Zap className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="font-black font-sans uppercase text-lg text-muted-foreground">
              {t('list.empty')}
            </p>
            <p className="text-sm font-bold font-serif uppercase text-muted-foreground/70 mt-1">
              {t('list.emptyDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Language Switcher Component

**`src/components/language-switcher.tsx`:**
```typescript
import { useTranslation } from 'react-i18next';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'da', name: 'Dansk', flag: '🇩🇰' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    // Also update user preference in database
    // Also trigger autocomplete cache reload for new language
  };

  return (
    <Select value={i18n.language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px] border-2 border-foreground font-black uppercase text-xs">
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(31,41,55,1)]">
        {languages.map((lang) => (
          <SelectItem
            key={lang.code}
            value={lang.code}
            className="font-bold uppercase text-xs"
          >
            {lang.flag} {lang.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

### App Initialization

**Update `src/router.tsx` or `_layout/route.tsx`:**
```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n'; // Import i18n config

export function RootLayout() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Sync i18n language with Zero autocomplete
    const handleLanguageChange = (lang: string) => {
      // Trigger Zero to reload autocomplete cache for new language
      zero.query.groceryAutocomplete
        .where('language', '=', lang)
        .preload({ ttl: '10m' });
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [i18n]);

  return (
    <div>
      {/* Add language switcher to settings or header */}
      <LanguageSwitcher />
      <Outlet />
    </div>
  );
}
```

### Integration with Autocomplete

**Update AutocompleteInput to use current i18n language:**
```typescript
import { useTranslation } from 'react-i18next';

export function AutocompleteInput(props: AutocompleteInputProps) {
  const { i18n, t } = useTranslation('groceries');
  const language = i18n.language; // Current language code

  // Use language for Zero queries
  const autocompleteQuery = zero.query.groceryAutocomplete
    .where('language', '=', language)
    .where('prefix', '=', prefix)
    .limit(1);

  const [autocompleteCache] = useQuery(autocompleteQuery);

  // ... rest of component

  return (
    <div className="relative">
      <Input
        placeholder={t('form.placeholder')}
        // ... rest of props
      />
      {showDropdown && (
        <AutocompleteDropdown
          suggestions={suggestions}
          noResultsText={t('autocomplete.noResults')}
          loadingText={t('autocomplete.loading')}
          // ... rest of props
        />
      )}
    </div>
  );
}
```

### Database User Preference

**Update user table to store language preference:**
```typescript
// In src/schema.ts
export const user = pgTable("user", {
  // ... existing fields
  language: text("language").default('en').notNull(),
});
```

**Save language preference when changed:**
```typescript
async function updateUserLanguage(userId: string, language: string) {
  await db
    .update(user)
    .set({ language })
    .where(eq(user.id, userId));
}
```

### Implementation Checklist

- [ ] Install i18next dependencies
- [ ] Create i18n configuration file
- [ ] Set up translation file structure
- [ ] Create English translations (baseline)
- [ ] Create Danish translations
- [ ] Create Spanish/French/German/Portuguese translations (or hire translators)
- [ ] Build LanguageSwitcher component
- [ ] Integrate i18n into router/layout
- [ ] Update all hardcoded strings to use `t()` function
- [ ] Sync language preference with database
- [ ] Reload Zero autocomplete cache on language change
- [ ] Add language selector to user menu or settings page
- [ ] Test all languages thoroughly
- [ ] Add fallback handling for missing translations
- [ ] Document translation contribution process

### Translation Management Tools

**Option 1: Manual JSON Files**
- Pros: Simple, version controlled, no external dependencies
- Cons: Can become tedious with many strings

**Option 2: Crowdin / Lokalise**
- Pros: Professional translation management, collaboration features
- Cons: Monthly cost, additional complexity

**Recommendation**: Start with manual JSON files, move to Crowdin if translations grow beyond 1000 strings or if you need community contributions.

---

## UI/UX Design

### Autocomplete Dropdown (Brutalist Style)

```tsx
<div className="absolute top-full left-0 right-0 mt-2 bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] z-50">
  {suggestions.map((item, idx) => (
    <button
      key={item.id}
      className={`
        w-full p-3 text-left border-b-2 border-foreground last:border-b-0
        hover:bg-accent hover:text-accent-foreground
        ${idx === selectedIndex ? 'bg-accent text-accent-foreground' : ''}
        ${item.isInList ? 'opacity-50' : ''}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{item.categoryIcon}</span>
        <div className="flex-1">
          <p className="font-black font-sans uppercase text-sm">
            {item.name}
            {item.isInList && (
              <span className="ml-2 text-xs text-muted-foreground">
                (ALREADY IN LIST)
              </span>
            )}
          </p>
          <p className="text-xs font-bold text-muted-foreground">
            {item.source === 'personal' && '★ YOU BOUGHT THIS '}
            {item.usageCount > 0 && `${item.usageCount}X`}
            {item.source === 'global' && ' POPULAR'}
          </p>
        </div>
        <span className="text-xs font-black border-2 border-current px-2 py-1">
          {item.category.toUpperCase()}
        </span>
      </div>
    </button>
  ))}
</div>
```

### Input Field Updates

```tsx
<Input
  id="name-field"
  placeholder="ADD ITEM..."
  value={inputValue}
  onChange={handleInputChange}
  onKeyDown={handleKeyDown}
  autoComplete="off" // Disable browser autocomplete
  className="flex-1 border-2 border-border font-serif font-bold uppercase placeholder:text-muted-foreground text-sm"
/>
{showDropdown && <AutocompleteDropdown suggestions={filteredSuggestions} />}
```

---

## API Endpoints

### GET `/api/autocomplete?q={query}&lang={language}`
**Purpose**: Server-side autocomplete fallback (when local cache insufficient)

**Request:**
```typescript
{
  q: string; // Search query (min 2 chars)
  lang: string; // Language code (en, es, etc.)
  limit?: number; // Max results (default 8)
}
```

**Response:**
```typescript
{
  suggestions: Array<{
    name: string;
    category: GroceryCategory;
    source: 'global' | 'personal';
    score: number;
    usageCount: number;
    globalItemId?: string;
  }>;
  cached: boolean; // True if from cache, false if computed
}
```

---

### POST `/api/grocery/track-usage`
**Purpose**: Track user's item additions for learning

**Request:**
```typescript
{
  name: string;
  category: GroceryCategory;
  language: string;
  globalItemId?: string; // If matched to global item
}
```

**Response:**
```typescript
{
  success: boolean;
  userHistoryId: string;
}
```

---

### POST `/api/admin/seed-global-items`
**Purpose**: Bulk import global grocery items (admin only)

**Request:** FormData with CSV file

**Response:**
```typescript
{
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}
```

---

## Database Schema

### Full Schema Changes

```typescript
// Add to src/schema.ts

export const globalGroceryItems = pgTable("global_grocery_items", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  language: text("language").notNull().default('en'),
  category: groceryCategory("category").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  translations: jsonb("translations"),
  aliases: jsonb("aliases").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const userGroceryHistory = pgTable("user_grocery_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  nameNormalized: text("name_normalized").notNull(),
  category: groceryCategory("category").notNull(),
  language: text("language").notNull().default('en'),
  usageCount: integer("usage_count").notNull().default(1),
  lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  globalItemId: text("global_item_id").references(() => globalGroceryItems.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const groceryAutocomplete = pgTable("grocery_autocomplete", {
  id: text("id").primaryKey(),
  language: text("language").notNull(),
  prefix: text("prefix").notNull(),
  suggestions: jsonb("suggestions").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Add language to user table
export const user = pgTable("user", {
  // ... existing fields
  language: text("language").default('en'),
});

// Relations
export const globalGroceryItemsRelations = relations(
  globalGroceryItems,
  ({ many }) => ({
    userHistory: many(userGroceryHistory),
  })
);

export const userGroceryHistoryRelations = relations(
  userGroceryHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [userGroceryHistory.userId],
      references: [user.id],
    }),
    globalItem: one(globalGroceryItems, {
      fields: [userGroceryHistory.globalItemId],
      references: [globalGroceryItems.id],
    }),
  })
);
```

---

## Zero Sync Configuration

### Update zero-schema.ts

```typescript
export const permissions = definePermissions<unknown, Schema>(schema, () => ({
  // ... existing permissions

  globalGroceryItems: {
    row: {
      select: ['id', 'name', 'category', 'language', 'usageCount'],
      // Hide translations/aliases from general users (only show relevant language)
    },
  },

  userGroceryHistory: {
    row: {
      select: (row) => row.userId === authData.userId, // User can only see their own
    },
  },

  groceryAutocomplete: {
    row: {
      select: (row) => row.language === authData.language, // Only sync user's language
    },
  },
}));
```

### Preload Strategy (zero-init.tsx)

```typescript
function preload(z: Zero<Schema>) {
  setTimeout(() => {
    const userLanguage = getUserLanguage(); // Detect from browser or user settings

    // Preload autocomplete cache for user's language
    z.query.groceryAutocomplete
      .where('language', '=', userLanguage)
      .limit(500) // Top 500 prefixes
      .preload({ ttl: '10m' });

    // Preload user's personal history
    z.query.userGroceryHistory
      .where('userId', '=', authData.userId)
      .orderBy('lastUsedAt', 'desc')
      .limit(100) // Last 100 items
      .preload({ ttl: '5m' });
  }, 1000);
}
```

---

## Implementation Components

### 1. AutocompleteInput Component

```typescript
// src/components/autocomplete-input.tsx
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@rocicorp/zero/react';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  language: string;
  existingItems: string[]; // To detect duplicates
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  language,
  existingItems
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debouncedValue = useDebounce(value, 150);

  // Query user history
  const userHistoryQuery = zero.query.userGroceryHistory
    .where('userId', '=', currentUserId)
    .where('nameNormalized', 'like', `${debouncedValue.toLowerCase()}%`)
    .orderBy('usageCount', 'desc')
    .limit(5);

  const [userHistory] = useQuery(userHistoryQuery);

  // Query autocomplete cache
  const prefix = debouncedValue.slice(0, 3).toLowerCase();
  const autocompleteQuery = zero.query.groceryAutocomplete
    .where('language', '=', language)
    .where('prefix', '=', prefix)
    .limit(1);

  const [autocompleteCache] = useQuery(autocompleteQuery);

  // Combine and rank suggestions
  const suggestions = useMemo(() => {
    return rankSuggestions(userHistory, autocompleteCache, debouncedValue, existingItems);
  }, [userHistory, autocompleteCache, debouncedValue, existingItems]);

  // Keyboard handling
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          onSelect(suggestions[selectedIndex]);
          setShowDropdown(false);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        break;
    }
  };

  return (
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(e.target.value.length >= 2);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => value.length >= 2 && setShowDropdown(true)}
        placeholder="ADD ITEM..."
        autoComplete="off"
        className="..."
      />
      {showDropdown && suggestions.length > 0 && (
        <AutocompleteDropdown
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={(item) => {
            onSelect(item);
            setShowDropdown(false);
          }}
        />
      )}
    </div>
  );
}
```

### 2. Suggestion Ranking Algorithm

```typescript
// src/lib/autocomplete-ranking.ts
export function rankSuggestions(
  userHistory: UserGroceryHistory[],
  autocompleteCache: GroceryAutocomplete | null,
  query: string,
  existingItems: string[]
): Suggestion[] {
  const queryNorm = query.toLowerCase();
  const suggestions = new Map<string, Suggestion>();

  // 1. Add user history (highest priority)
  userHistory.forEach(item => {
    const score =
      (item.nameNormalized === queryNorm ? 100 : 0) +
      (item.lastUsedAt > Date.now() - 30 * 24 * 60 * 60 * 1000 ? 20 : 0) + // Recent bonus
      (item.usageCount * 5) +
      (item.nameNormalized.startsWith(queryNorm) ? 10 : 0);

    suggestions.set(item.nameNormalized, {
      name: item.name,
      category: item.category,
      source: 'personal',
      score,
      usageCount: item.usageCount,
      isInList: existingItems.includes(item.nameNormalized),
      globalItemId: item.globalItemId,
    });
  });

  // 2. Add global suggestions (lower priority if not in user history)
  if (autocompleteCache?.suggestions) {
    (autocompleteCache.suggestions as AutocompleteSuggestion[]).forEach(item => {
      if (!suggestions.has(item.name.toLowerCase())) {
        const score =
          (item.score || 0) +
          (item.name.toLowerCase().startsWith(queryNorm) ? 10 : 0);

        suggestions.set(item.name.toLowerCase(), {
          name: item.name,
          category: item.category,
          source: 'global',
          score,
          usageCount: 0,
          isInList: existingItems.includes(item.name.toLowerCase()),
          globalItemId: item.globalItemId,
        });
      }
    });
  }

  // Sort by score, then alphabetically
  return Array.from(suggestions.values())
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 8);
}
```

---

## Background Jobs

### 1. Autocomplete Cache Builder (Cron Job)

```typescript
// Run every 6 hours
export async function buildAutocompleteCache(language: string) {
  const prefixes = generatePrefixes(); // ['a', 'ab', 'abc', ..., 'z', 'za', 'zab']

  for (const prefix of prefixes) {
    const globalItems = await db
      .select()
      .from(globalGroceryItems)
      .where(and(
        eq(globalGroceryItems.language, language),
        like(globalGroceryItems.nameNormalized, `${prefix}%`)
      ))
      .orderBy(desc(globalGroceryItems.usageCount))
      .limit(10);

    const suggestions = globalItems.map(item => ({
      name: item.name,
      category: item.category,
      source: 'global' as const,
      score: item.usageCount * 0.01,
      globalItemId: item.id,
    }));

    await db
      .insert(groceryAutocomplete)
      .values({
        id: nanoid(),
        language,
        prefix,
        suggestions,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [groceryAutocomplete.language, groceryAutocomplete.prefix],
        set: { suggestions, updatedAt: new Date() },
      });
  }
}
```

### 2. Global Item Usage Updater

```typescript
// Run daily
export async function updateGlobalItemUsage() {
  // Aggregate user history to update global usage counts
  const usageCounts = await db
    .select({
      globalItemId: userGroceryHistory.globalItemId,
      totalUsage: sql`SUM(${userGroceryHistory.usageCount})`,
    })
    .from(userGroceryHistory)
    .where(isNotNull(userGroceryHistory.globalItemId))
    .groupBy(userGroceryHistory.globalItemId);

  for (const { globalItemId, totalUsage } of usageCounts) {
    await db
      .update(globalGroceryItems)
      .set({ usageCount: totalUsage })
      .where(eq(globalGroceryItems.id, globalItemId));
  }
}
```

---

## Seed Data

### Initial Global Items (English)

```csv
name,category,language,usageCount,aliases
Milk,dairy,en,1000,"[""whole milk"",""2% milk"",""skim milk""]"
Bread,bakery,en,950,"[""white bread"",""wheat bread"",""sourdough""]"
Eggs,dairy,en,900,"[""dozen eggs"",""free range eggs""]"
Bananas,produce,en,850,"[""banana""]"
Chicken Breast,meat,en,800,"[""chicken"",""chicken breasts""]"
Apples,produce,en,750,"[""apple""]"
Rice,pantry,en,700,"[""white rice"",""brown rice""]"
Pasta,pantry,en,650,"[""spaghetti"",""penne""]"
Tomatoes,produce,en,600,"[""tomato""]"
Cheese,dairy,en,550,"[""cheddar"",""mozzarella""]"
```

---

## Testing Considerations

### Manual Test Cases
1. **Basic autocomplete**: Type "mil" → Verify "Milk" appears
2. **Personal history**: Add "Oat Milk" 3 times → Type "oa" → Verify it ranks first
3. **Duplicate detection**: Add "Milk" → Type "mil" → Verify "(already in list)" badge
4. **Multi-language**: Change language to Spanish → Type "lec" → Verify "Leche" appears
5. **Offline**: Disconnect network → Type "mi" → Verify cached suggestions appear
6. **Keyboard nav**: Type "mi" → Press ↓ → Enter → Verify selection
7. **Category inference**: Select "Milk" → Verify "Dairy" auto-selected
8. **Empty results**: Type "zzz" → Verify "No suggestions" message

### Performance Benchmarks
- Autocomplete response time: <300ms (P95)
- Zero sync latency: <100ms (local cache hit)
- Database query time: <50ms
- Preload time: <2s on app startup

---

## Migration Strategy

### Phase 1: Foundation (Week 1-2)
- Create database tables
- Seed global items (English only)
- Build autocomplete cache
- Implement basic UI component

### Phase 2: Personal Learning (Week 3)
- Track user history
- Implement ranking algorithm
- Build personal suggestions

### Phase 3: Zero Sync (Week 4)
- Configure Zero permissions
- Implement preload strategy
- Test offline support

### Phase 4: Multi-Language (Week 5+)
- Add Spanish, French, German, Portuguese, Danish seed data
- Implement language detection
- Build translation management

---

## Success Metrics

- **Adoption**: 80%+ of users use autocomplete
- **Accuracy**: Top-3 suggestion selected 70%+ of time
- **Performance**: <300ms response time (P95)
- **Learning**: Personal suggestions improve by 30% after 10 uses
- **Duplicates**: Reduce duplicate items by 50%

---

## Open Questions

### 1. Should we crowdsource global items?
**Approach**: Allow users to suggest new global items
**Pros**: Scales better, more diverse catalog
**Cons**: Quality control, moderation needed
**Decision**: Start with curated seed, add crowdsourcing in Phase 5

### 2. How to handle brand names?
**Example**: "Coca-Cola" vs "Coke" vs "Soda"
**Approach**: Add as aliases, let users choose
**Decision**: Store brand names in aliases field

### 3. Privacy concerns with usage tracking?
**Issue**: Users may not want us tracking their groceries
**Approach**: Make tracking opt-out, anonymize data
**Decision**: Always track for better UX, add opt-out in settings

### 4. How many languages to support initially?
**Options**: English only vs top 6 languages
**Decision**: Start with English, add Spanish/French/German/Portuguese/Danish in Phase 4
