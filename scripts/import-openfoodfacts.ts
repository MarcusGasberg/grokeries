/**
 * OpenFoodFacts Import Script
 *
 * Imports grocery items from the OpenFoodFacts API (https://world.openfoodfacts.org/)
 * - Free, open database with 2.8M+ food products
 * - Multi-language support
 * - CC BY-SA 3.0 license
 *
 * Usage:
 *   bun run scripts/import-openfoodfacts.ts --language=en --limit=200
 *   sst shell --stage production bun run scripts/import-openfoodfacts.ts --language=en
 */

import { nanoid } from "nanoid";
import { globalGroceryItems, type GroceryCategory } from "@/schema";
import { db } from "@/drizzle/drizzle";

const OPENFOODFACTS_API = "https://world.openfoodfacts.org/api/v2/search";

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : defaultValue;
};

const TARGET_LANGUAGE = getArg("language", "en");
const ITEMS_PER_CATEGORY = parseInt(getArg("limit", "200"), 10);

interface OpenFoodFactsProduct {
  product_name?: string;
  generic_name?: string;
  categories_tags?: string[];
  unique_scans_n?: number;
  [key: string]: any;
}

interface OpenFoodFactsResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

/**
 * Map our grocery categories to OpenFoodFacts category tags
 */
const CATEGORY_MAPPING: Record<GroceryCategory, string[]> = {
  dairy: ["en:dairies", "en:milk", "en:cheese", "en:yogurt"],
  produce: ["en:plant-based-foods", "en:fruits", "en:vegetables"],
  meat: ["en:meats", "en:poultry", "en:seafood", "en:fish"],
  bakery: ["en:breads", "en:pastries", "en:baked-goods"],
  frozen: ["en:frozen-foods", "en:ice-cream"],
  pantry: ["en:groceries", "en:canned-foods", "en:rice", "en:pasta"],
  beverages: ["en:beverages", "en:drinks", "en:juices", "en:sodas"],
  household: ["en:household-products", "en:cleaning-products"],
  other: ["en:food"],
};

/**
 * Infer grocery category from OpenFoodFacts categories
 */
function inferCategory(categories: string[] | undefined): GroceryCategory {
  if (!categories || categories.length === 0) {
    return "other";
  }

  const categoriesLower = categories.map((c) => c.toLowerCase());

  // Check each category in priority order
  for (const [category, tags] of Object.entries(CATEGORY_MAPPING)) {
    if (tags.some((tag) => categoriesLower.some((c) => c.includes(tag)))) {
      return category as GroceryCategory;
    }
  }

  return "other";
}

/**
 * Check if product name is valid and generic enough for grocery list
 */
function isValidGroceryName(name: string): boolean {
  const lower = name.toLowerCase().trim();

  // Reject if too short
  if (lower.length < 3) return false;

  // Reject if contains brand-specific indicators
  const brandIndicators = [
    /\d{2,}ml/i, // "500ml"
    /\d{2,}l\b/i, // "1L"
    /\d{2,}g\b/i, // "500g"
    /\d+x\d+/i, // "3x100"
    /pack of/i,
    /\bsku\b/i,
    /barcode/i,
  ];

  if (brandIndicators.some((pattern) => pattern.test(lower))) {
    return false;
  }

  // Reject if mostly numbers
  const digitCount = (lower.match(/\d/g) || []).length;
  if (digitCount > lower.length * 0.3) return false;

  // Reject if looks like a brand/product code
  if (/^[A-Z0-9\-]{8,}$/i.test(lower.replace(/\s/g, ""))) return false;

  return true;
}

/**
 * Clean product name (remove brand names, weird characters, etc.)
 */
function cleanProductName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ") // Collapse multiple spaces
    .replace(/[^\w\s\-']/g, "") // Remove special chars except hyphens and apostrophes
    .slice(0, 100); // Limit length
}

/**
 * Fetch products from OpenFoodFacts for a specific category
 */
async function fetchCategoryProducts(
  category: GroceryCategory,
  language: string,
  limit: number,
): Promise<OpenFoodFactsProduct[]> {
  const categoryTags = CATEGORY_MAPPING[category];
  const allProducts: OpenFoodFactsProduct[] = [];

  console.log(
    `\n📦 Fetching ${category} items (${categoryTags.join(", ")})...`,
  );

  // OpenFoodFacts limits to 100 per page, so we may need multiple requests
  const pages = Math.ceil(limit / 100);

  for (let page = 1; page <= pages; page++) {
    const pageSize = Math.min(100, limit - allProducts.length);

    for (const tag of categoryTags) {
      try {
        const url = new URL(OPENFOODFACTS_API);
        url.searchParams.set("categories_tags", tag);
        url.searchParams.set(
          "fields",
          "product_name,generic_name,categories_tags,unique_scans_n",
        );
        url.searchParams.set("page_size", pageSize.toString());
        url.searchParams.set("page", page.toString());
        url.searchParams.set("sort_by", "unique_scans_n");
        url.searchParams.set("sort_order", "desc"); // Get most popular items first
        url.searchParams.set("json", "1");

        console.log(`   Fetching page ${page} for tag ${tag}...`);

        const response = await fetch(url.toString());

        if (!response.ok) {
          console.error(`   ⚠️  HTTP ${response.status} for ${tag}`);
          continue;
        }

        const data: OpenFoodFactsResponse = await response.json();

        if (data.products && data.products.length > 0) {
          allProducts.push(...data.products);
          console.log(`   ✅ Got ${data.products.length} products from ${tag}`);
        }

        // Rate limiting: be nice to OpenFoodFacts API
        await new Promise((resolve) => setTimeout(resolve, 500));

        if (allProducts.length >= limit) {
          break;
        }
      } catch (error) {
        console.error(`   ❌ Error fetching ${tag}:`, error);
      }
    }

    if (allProducts.length >= limit) {
      break;
    }
  }

  // Deduplicate by product name
  const uniqueProducts = new Map<string, OpenFoodFactsProduct>();
  for (const product of allProducts) {
    const name = product.product_name || product.generic_name;
    if (name && !uniqueProducts.has(name.toLowerCase())) {
      uniqueProducts.set(name.toLowerCase(), product);
    }
  }

  const dedupedProducts = Array.from(uniqueProducts.values()).slice(0, limit);
  console.log(`   📊 Deduped to ${dedupedProducts.length} unique items`);

  return dedupedProducts;
}

/**
 * Import a single product into the database
 */
async function importProduct(
  product: OpenFoodFactsProduct,
  category: GroceryCategory,
  language: string,
): Promise<boolean> {
  // Prefer generic name over product name (more likely to be generic)
  const name = product.generic_name || product.product_name;

  if (!name || name.length < 2) {
    return false;
  }

  // Validate before cleaning
  if (!isValidGroceryName(name)) {
    return false;
  }

  const cleanedName = cleanProductName(name);

  // Validate after cleaning too
  if (!isValidGroceryName(cleanedName)) {
    return false;
  }

  const nameNormalized = cleanedName.toLowerCase().trim();
  const popularity = product.unique_scans_n || 0;

  try {
    await db
      .insert(globalGroceryItems)
      .values({
        id: nanoid(),
        name: cleanedName,
        nameNormalized,
        language,
        category,
        popularity,
        aliases: [], // OpenFoodFacts doesn't provide aliases directly
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoNothing(); // Skip if already exists

    return true;
  } catch (error) {
    console.error(`   ⚠️  Failed to import "${cleanedName}":`, error);
    return false;
  }
}

/**
 * Main import function
 */
async function importFromOpenFoodFacts() {
  console.log("🌍 OpenFoodFacts Import Starting...\n");
  console.log(`   Language: ${TARGET_LANGUAGE}`);
  console.log(`   Items per category: ${ITEMS_PER_CATEGORY}`);
  console.log(`   Total target: ~${ITEMS_PER_CATEGORY * 9} items\n`);

  const categories: GroceryCategory[] = [
    "dairy",
    "produce",
    "meat",
    "bakery",
    "frozen",
    "pantry",
    "beverages",
    "household",
  ];

  let totalImported = 0;
  let totalFetched = 0;

  for (const category of categories) {
    const products = await fetchCategoryProducts(
      category,
      TARGET_LANGUAGE,
      ITEMS_PER_CATEGORY,
    );

    totalFetched += products.length;

    console.log(`\n💾 Importing ${products.length} ${category} items...`);

    let imported = 0;
    for (const product of products) {
      const success = await importProduct(product, category, TARGET_LANGUAGE);
      if (success) {
        imported++;
      }

      if (imported % 20 === 0 && imported > 0) {
        console.log(`   Imported ${imported}/${products.length}...`);
      }
    }

    totalImported += imported;

    console.log(`   ✅ ${category}: ${imported}/${products.length} imported`);
  }

  console.log(`\n🎉 Import Complete!`);
  console.log(`   Total fetched: ${totalFetched}`);
  console.log(`   Total imported: ${totalImported}`);
  console.log(`   Language: ${TARGET_LANGUAGE}`);
  console.log(
    `\n📊 Database now contains ${totalImported} ${TARGET_LANGUAGE} items from OpenFoodFacts`,
  );
}

// Run the import
importFromOpenFoodFacts()
  .catch((error) => {
    console.error("\n❌ Import failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
