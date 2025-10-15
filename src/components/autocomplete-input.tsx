import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@rocicorp/zero/react";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  rankSuggestions,
  type AutocompleteSuggestion,
} from "@/lib/autocomplete";
import type { Zero } from "@rocicorp/zero";
import type { Schema } from "@/zero/zero-schema";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AutocompleteSuggestion) => void;
  placeholder?: string;
  className?: string;
  zero: Zero<Schema>;
  userId: string;
  existingItemNames: string[];
  disabled?: boolean;
  id?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = "ADD ITEM...",
  className,
  zero,
  userId,
  existingItemNames,
  disabled,
  id,
}: AutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const debouncedValue = useDebounce(value, 150);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const justSelectedRef = useRef(false);

  // Query global grocery items
  const globalItemsQuery = zero.query.globalGroceryItems
    .where("language", "=", "en")
    .orderBy("popularity", "desc");

  const [globalItems] = useQuery(globalItemsQuery);

  // Query user's history
  const userHistoryQuery = zero.query.userGroceryHistory
    .where("userId", "=", userId)
    .orderBy("lastUsedAt", "desc");

  const [userHistory] = useQuery(userHistoryQuery);

  // Compute suggestions
  const suggestions = useMemo(() => {
    const existingSet = new Set(existingItemNames.map((n) => n.toLowerCase()));

    // If no query, show popular items from user history and global
    if (debouncedValue.length === 0) {
      const seenNormalized = new Set<string>();
      const personalItems: AutocompleteSuggestion[] = [];

      // Get top personal items, deduplicating by normalized name
      for (const item of userHistory ?? []) {
        if (seenNormalized.has(item.nameNormalized)) {
          continue;
        }
        seenNormalized.add(item.nameNormalized);

        const isInList = existingSet.has(item.nameNormalized);
        personalItems.push({
          id: item.id,
          name: item.name,
          nameNormalized: item.nameNormalized,
          category: item.category,
          source: "personal" as const,
          score: isInList ? -1000 : (item.usageCount ?? 0) * 10,
          usageCount: item.usageCount ?? 0,
          isInList,
          globalItemId: item.globalItemId ?? undefined,
        });

        if (personalItems.length >= 5) break;
      }

      const globalPopular: AutocompleteSuggestion[] = [];

      // Get top global items, deduplicating by normalized name
      for (const item of globalItems ?? []) {
        if (seenNormalized.has(item.nameNormalized)) {
          continue;
        }
        seenNormalized.add(item.nameNormalized);

        const isInList = existingSet.has(item.nameNormalized);
        globalPopular.push({
          id: item.id,
          name: item.name,
          nameNormalized: item.nameNormalized,
          category: item.category,
          source: "global" as const,
          score: isInList ? -1000 : (item.popularity ?? 0),
          usageCount: 0,
          isInList,
          globalItemId: item.id,
        });

        if (globalPopular.length >= (8 - personalItems.length)) break;
      }

      return [...personalItems, ...globalPopular]
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }

    const ranked = rankSuggestions(
      debouncedValue,
      globalItems ?? [],
      userHistory ?? [],
      existingItemNames,
    );

    // Sort so items already in list appear last
    return ranked.sort((a, b) => {
      if (a.isInList && !b.isInList) return 1;
      if (!a.isInList && b.isInList) return -1;
      return b.score - a.score;
    });
  }, [debouncedValue, globalItems, userHistory, existingItemNames]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setIsInputFocused(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  // Show dropdown when input is focused and suggestions are available
  useEffect(() => {
    if (isInputFocused && suggestions.length > 0 && !justSelectedRef.current) {
      setShowDropdown(true);
    }
  }, [isInputFocused, suggestions.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setShowDropdown(true);
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setShowDropdown(true);
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (showDropdown) {
          e.preventDefault();
          // Select the highlighted item, or the first item if nothing is highlighted
          const indexToSelect = selectedIndex >= 0 ? selectedIndex : 0;
          if (suggestions[indexToSelect]) {
            handleSelectSuggestion(suggestions[indexToSelect]);
          }
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: AutocompleteSuggestion) => {
    justSelectedRef.current = true;
    onSelect(suggestion);
    setShowDropdown(false);
    setSelectedIndex(-1);
    // Reset the flag after a short delay
    setTimeout(() => {
      justSelectedRef.current = false;
    }, 300);
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: Record<string, string> = {
      produce: "🥬",
      dairy: "🥛",
      meat: "🥩",
      pantry: "🥫",
      bakery: "🍞",
      frozen: "🧊",
      beverages: "🍹",
      household: "🧼",
      other: "📦",
    };
    return iconMap[category] || "📦";
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        id={id}
        value={value}
        onChange={(e) => {
          // User is typing, allow dropdown to reopen
          justSelectedRef.current = false;
          onChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsInputFocused(true);
          if (suggestions.length > 0) {
            setShowDropdown(true);
          }
        }}
        onBlur={() => {
          // Delay to allow click events on dropdown items to fire first
          setTimeout(() => {
            setIsInputFocused(false);
          }, 200);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
        disabled={disabled}
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-background border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(31,41,55,1)] z-50 max-h-[400px] overflow-y-auto"
        >
          {suggestions.map((suggestion, idx) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSelectSuggestion(suggestion)}
              className={`
                w-full p-3 text-left border-b-2 border-foreground last:border-b-0
                hover:bg-accent hover:text-accent-foreground transition-colors
                ${idx === selectedIndex ? "bg-accent text-accent-foreground" : ""}
                ${suggestion.isInList ? "opacity-50" : ""}
              `}
              disabled={suggestion.isInList}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl flex-shrink-0">
                  {getCategoryIcon(suggestion.category)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black font-sans uppercase text-sm truncate">
                    {suggestion.name}
                    {suggestion.isInList && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (ALREADY IN LIST)
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground">
                    {suggestion.source === "personal" && (
                      <span>★ YOU BOUGHT THIS {suggestion.usageCount}X</span>
                    )}
                    {suggestion.source === "global" && <span>POPULAR</span>}
                  </p>
                </div>
                <span className="text-xs font-black border-2 border-current px-2 py-1 uppercase flex-shrink-0">
                  {suggestion.category}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
