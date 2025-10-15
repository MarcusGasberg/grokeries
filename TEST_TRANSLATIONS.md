# Translation Testing Guide

## Current Status
✅ i18next fully integrated
✅ Translation files imported directly (no HTTP backend needed)
✅ Language switcher moved to UserMenu dropdown
✅ English and Danish translations complete

## How to Test

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Access the groceries page**:
   - Login/Register
   - Navigate to groceries list

3. **Test language switching**:
   - Click the hamburger menu (⋮) in top right
   - Scroll to "LANGUAGE" section
   - Click "🇺🇸 ENGLISH" or "🇩🇰 DANSK"
   - All text should change immediately

## What Should Change

### English (Default)
- App title: "GROKERIES"
- Tagline: "EFFICIENT SHOPPING"
- Progress: "PROGRESS"
- Add button: "DESTROY HUNGER"
- Empty list: "EMPTY LIST" / "ADD ITEMS TO DOMINATE"
- Categories: "🥬 Produce", "🥛 Dairy", etc.
- Autocomplete: "★ YOU BOUGHT THIS 3X", "POPULAR", "(ALREADY IN LIST)"

### Danish
- App title: "GROKERIES" (brand name stays)
- Tagline: "EFFEKTIV INDKØB"
- Progress: "FREMSKRIDT"
- Add button: "TILINTETGØR SULT"
- Empty list: "TOM LISTE" / "TILFØJ VARER FOR AT DOMINERE"
- Categories: "🥬 Grøntsager", "🥛 Mejeriprodukter", etc.
- Autocomplete: "★ DU KØBTE DETTE 3X", "POPULÆR", "(ALLEREDE PÅ LISTEN)"

## Troubleshooting

If translations show as keys (e.g., "common.app.name"):
1. Check browser console for i18next errors
2. Verify translation files are loaded: `i18n.hasResourceBundle('en', 'common')`
3. Check language detection: `i18n.language` should be "en" or "da"

## Next Steps

To add more languages:
1. Create translation files in `public/locales/{lang}/`
2. Import them in `src/lib/i18n.ts`
3. Add to `resources` object
4. Add language to UserMenu dropdown in `src/components/user-menu.tsx`
