import type { GlobalGroceryItem, UserGroceryHistory } from "@/zero/zero-schema";

export interface AutocompleteSuggestion {
  id: string;
  name: string;
  nameNormalized: string;
  category: string;
  source: "personal" | "global";
  score: number;
  usageCount: number;
  isInList: boolean;
  globalItemId?: string;
}

/**
 * Ranks and filters autocomplete suggestions based on user query,
 * combining personal history and global items.
 *
 * Algorithm:
 * 1. Filter items matching query (prefix match or alias match)
 * 2. Score items based on:
 *    - Exact match: +100 points
 *    - User has added before: +50 points
 *    - Recent usage (last 30 days): +20 points
 *    - Usage count: +5 points per use
 *    - Prefix match: +10 points
 *    - Global popularity: use as base score
 * 3. Sort by score (descending), then alphabetically
 * 4. Return top 8 suggestions
 */
export function rankSuggestions(
  query: string,
  globalItems: GlobalGroceryItem[],
  userHistory: UserGroceryHistory[],
  existingItemNames: string[],
): AutocompleteSuggestion[] {
  const queryNorm = query.toLowerCase().trim();

  if (queryNorm.length === 0) {
    return [];
  }

  const existingSet = new Set(existingItemNames.map((n) => n.toLowerCase()));
  const suggestions = new Map<string, AutocompleteSuggestion>();

  // Process user history first (highest priority)
  for (const historyItem of userHistory) {
    if (
      !historyItem.nameNormalized.startsWith(queryNorm) &&
      !matchesQuery(queryNorm, historyItem.nameNormalized)
    ) {
      continue;
    }

    const isRecent =
      new Date(historyItem.lastUsedAt ?? 0).getTime() >
      Date.now() - 30 * 24 * 60 * 60 * 1000;

    const score =
      (historyItem.nameNormalized === queryNorm ? 100 : 0) +
      50 + // Personal item bonus
      (isRecent ? 20 : 0) +
      (historyItem.usageCount ?? 0) * 5 +
      (historyItem.nameNormalized.startsWith(queryNorm) ? 10 : 0);

    suggestions.set(historyItem.nameNormalized, {
      id: historyItem.id,
      name: historyItem.name,
      nameNormalized: historyItem.nameNormalized,
      category: historyItem.category,
      source: "personal",
      score,
      usageCount: historyItem.usageCount ?? 0,
      isInList: existingSet.has(historyItem.nameNormalized),
      globalItemId: historyItem.globalItemId ?? undefined,
    });
  }

  // Add global items (lower priority if not in user history)
  for (const globalItem of globalItems) {
    // Skip if already in suggestions from user history
    if (suggestions.has(globalItem.nameNormalized)) {
      continue;
    }

    if (
      !globalItem.nameNormalized.startsWith(queryNorm) &&
      !matchesAliases(queryNorm, globalItem.aliases)
    ) {
      continue;
    }

    const score =
      (globalItem.nameNormalized === queryNorm ? 100 : 0) +
      (globalItem.nameNormalized.startsWith(queryNorm) ? 10 : 0) +
      (globalItem.popularity || 0) / 10; // Normalize popularity

    suggestions.set(globalItem.nameNormalized, {
      id: globalItem.id,
      name: globalItem.name,
      nameNormalized: globalItem.nameNormalized,
      category: globalItem.category,
      source: "global",
      score,
      usageCount: 0,
      isInList: existingSet.has(globalItem.nameNormalized),
      globalItemId: globalItem.id,
    });
  }

  // Sort by score (descending), then alphabetically
  return Array.from(suggestions.values())
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, 8);
}

/**
 * Check if query matches item name (simple contains check for flexibility)
 */
function matchesQuery(query: string, itemName: string): boolean {
  return itemName.includes(query);
}

/**
 * Check if query matches any of the item's aliases
 */
function matchesAliases(
  query: string,
  aliases: string[] | null | undefined,
): boolean {
  if (!aliases || aliases.length === 0) {
    return false;
  }

  return aliases.some((alias) => alias.toLowerCase().startsWith(query));
}

/**
 * Check if an item name already exists in the current list
 */
export function checkDuplicate(name: string, existingNames: string[]): boolean {
  const normalized = name.toLowerCase().trim();
  return existingNames.some((n) => n.toLowerCase().trim() === normalized);
}

/**
 * Find matching global item by name (case-insensitive)
 */
export function findGlobalItem(
  name: string,
  globalItems: GlobalGroceryItem[],
): GlobalGroceryItem | undefined {
  const normalized = name.toLowerCase().trim();
  return globalItems.find(
    (item) =>
      item.nameNormalized === normalized ||
      item.aliases?.some((alias) => alias.toLowerCase() === normalized),
  );
}
