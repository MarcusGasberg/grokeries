import { describe, it, expect } from "vitest";
import {
  rankSuggestions,
  checkDuplicate,
  findGlobalItem,
} from "./autocomplete";
import type { GlobalGroceryItem, UserGroceryHistory } from "@/zero/zero-schema";

describe("rankSuggestions", () => {
  const mockGlobalItems: GlobalGroceryItem[] = [
    {
      id: "1",
      name: "Milk",
      nameNormalized: "milk",
      language: "en",
      category: "dairy",
      popularity: 1000,
      aliases: ["whole milk", "2% milk", "skim milk"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Bread",
      nameNormalized: "bread",
      language: "en",
      category: "bakery",
      popularity: 950,
      aliases: ["white bread", "wheat bread"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      name: "Butter",
      nameNormalized: "butter",
      language: "en",
      category: "dairy",
      popularity: 500,
      aliases: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockUserHistory: UserGroceryHistory[] = [
    {
      id: "h1",
      userId: "user1",
      name: "Milk",
      nameNormalized: "milk",
      category: "dairy",
      language: "en",
      usageCount: 10,
      lastUsedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      globalItemId: "1",
      createdAt: new Date(),
    },
  ];

  it("should return empty array for queries less than 2 characters", () => {
    const result = rankSuggestions("m", mockGlobalItems, mockUserHistory, []);
    expect(result).toEqual([]);
  });

  it("should rank personal history items higher than global items", () => {
    const result = rankSuggestions("mi", mockGlobalItems, mockUserHistory, []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Milk");
    expect(result[0].source).toBe("personal");
  });

  it("should match items by prefix", () => {
    const result = rankSuggestions("br", mockGlobalItems, [], []);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].name).toBe("Bread");
  });

  it("should match items by aliases", () => {
    const result = rankSuggestions("wh", mockGlobalItems, [], []);
    const whiteBreak = result.find((s) => s.name === "Bread");
    expect(whiteBreak).toBeDefined();
  });

  it("should mark items already in list", () => {
    const result = rankSuggestions("mi", mockGlobalItems, mockUserHistory, [
      "Milk",
    ]);
    const milkSuggestion = result.find((s) => s.name === "Milk");
    expect(milkSuggestion?.isInList).toBe(true);
  });

  it("should limit results to 8 suggestions", () => {
    const manyItems: GlobalGroceryItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `item-${i}`,
      name: `Milk ${i}`,
      nameNormalized: `milk ${i}`,
      language: "en",
      category: "dairy",
      popularity: 100 - i,
      aliases: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = rankSuggestions("mi", manyItems, [], []);
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it("should handle exact matches with higher priority", () => {
    const result = rankSuggestions("milk", mockGlobalItems, mockUserHistory, []);
    expect(result[0].name).toBe("Milk");
    expect(result[0].score).toBeGreaterThan(0);
  });

  it("should boost recent usage", () => {
    const recentHistory: UserGroceryHistory[] = [
      {
        id: "h1",
        userId: "user1",
        name: "Butter",
        nameNormalized: "butter",
        category: "dairy",
        language: "en",
        usageCount: 2,
        lastUsedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago (recent)
        globalItemId: "3",
        createdAt: new Date(),
      },
    ];

    const result = rankSuggestions("bu", mockGlobalItems, recentHistory, []);
    expect(result[0].name).toBe("Butter");
    expect(result[0].source).toBe("personal");
  });

  it("should sort by popularity for global items", () => {
    const result = rankSuggestions("br", mockGlobalItems, [], []);
    const breadSuggestion = result.find((s) => s.name === "Bread");
    expect(breadSuggestion).toBeDefined();
    expect(breadSuggestion?.source).toBe("global");
  });
});

describe("checkDuplicate", () => {
  it("should detect exact duplicate (case-insensitive)", () => {
    const result = checkDuplicate("Milk", ["milk", "bread"]);
    expect(result).toBe(true);
  });

  it("should detect duplicate with different casing", () => {
    const result = checkDuplicate("BREAD", ["Milk", "Bread"]);
    expect(result).toBe(true);
  });

  it("should return false for non-duplicates", () => {
    const result = checkDuplicate("Eggs", ["Milk", "Bread"]);
    expect(result).toBe(false);
  });

  it("should handle whitespace correctly", () => {
    const result = checkDuplicate("  Milk  ", ["milk"]);
    expect(result).toBe(true);
  });

  it("should return false for empty list", () => {
    const result = checkDuplicate("Milk", []);
    expect(result).toBe(false);
  });
});

describe("findGlobalItem", () => {
  const mockGlobalItems: GlobalGroceryItem[] = [
    {
      id: "1",
      name: "Milk",
      nameNormalized: "milk",
      language: "en",
      category: "dairy",
      popularity: 1000,
      aliases: ["whole milk", "2% milk"],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      name: "Bread",
      nameNormalized: "bread",
      language: "en",
      category: "bakery",
      popularity: 950,
      aliases: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("should find item by exact name match", () => {
    const result = findGlobalItem("Milk", mockGlobalItems);
    expect(result).toBeDefined();
    expect(result?.id).toBe("1");
  });

  it("should find item by case-insensitive name", () => {
    const result = findGlobalItem("BREAD", mockGlobalItems);
    expect(result).toBeDefined();
    expect(result?.id).toBe("2");
  });

  it("should find item by alias", () => {
    const result = findGlobalItem("whole milk", mockGlobalItems);
    expect(result).toBeDefined();
    expect(result?.id).toBe("1");
  });

  it("should return undefined for non-existent item", () => {
    const result = findGlobalItem("Eggs", mockGlobalItems);
    expect(result).toBeUndefined();
  });

  it("should handle whitespace in search", () => {
    const result = findGlobalItem("  milk  ", mockGlobalItems);
    expect(result).toBeDefined();
    expect(result?.id).toBe("1");
  });
});
