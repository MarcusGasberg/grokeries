/**
 * Rema 1000 Web Scraper
 *
 * Scrapes grocery items from https://shop.rema1000.dk/
 * Uses Playwright to handle the SPA and extract product data
 *
 * Usage:
 *   bun add -d playwright
 *   bunx playwright install chromium
 *   bun run scripts/scrape-rema1000.ts --output=seed-data/rema1000-scraped.csv --limit=500
 */

import { chromium, type Browser, type Page } from "playwright";
import { writeFileSync } from "fs";
import type { GroceryCategory } from "@/schema";

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (name: string, defaultValue: string) => {
  const arg = args.find((a) => a.startsWith(`--${name}=`));
  return arg ? arg.split("=")[1] : defaultValue;
};

const OUTPUT_FILE = getArg("output", "seed-data/rema1000-scraped.csv");
const LIMIT = parseInt(getArg("limit", "500"), 10);

interface Product {
  name: string;
  category: GroceryCategory;
  popularity: number;
}

/**
 * Map Rema 1000 categories to our grocery categories
 */
function mapCategory(remaCategory: string): GroceryCategory {
  const lower = remaCategory.toLowerCase();

  if (lower.includes("mælk") || lower.includes("ost") || lower.includes("smør") || lower.includes("yoghurt")) {
    return "dairy";
  }
  if (lower.includes("frugt") || lower.includes("grønt") || lower.includes("grøntsager")) {
    return "produce";
  }
  if (lower.includes("kød") || lower.includes("fisk") || lower.includes("kylling")) {
    return "meat";
  }
  if (lower.includes("brød") || lower.includes("bagværk")) {
    return "bakery";
  }
  if (lower.includes("frost") || lower.includes("frosne") || lower.includes("is")) {
    return "frozen";
  }
  if (lower.includes("drik") || lower.includes("juice") || lower.includes("vand") || lower.includes("kaffe")) {
    return "beverages";
  }
  if (lower.includes("rengøring") || lower.includes("husholdning")) {
    return "household";
  }
  if (lower.includes("kolonial") || lower.includes("konserves") || lower.includes("pasta") || lower.includes("ris")) {
    return "pantry";
  }

  return "other";
}

/**
 * Clean product name to make it more generic
 */
function cleanProductName(name: string): string {
  return name
    .trim()
    // Remove brand-specific markers
    .replace(/\d+\s*g\b/gi, "")
    .replace(/\d+\s*ml\b/gi, "")
    .replace(/\d+\s*l\b/gi, "")
    .replace(/\d+\s*stk\.?/gi, "")
    .replace(/\d+\s*pak\.?/gi, "")
    // Clean up spaces
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if product name is valid
 */
function isValidProductName(name: string): boolean {
  if (name.length < 3) return false;

  // Reject if mostly numbers
  const digitCount = (name.match(/\d/g) || []).length;
  if (digitCount > name.length * 0.4) return false;

  return true;
}

/**
 * Scrape products from Rema 1000
 */
async function scrapeRema1000(): Promise<Product[]> {
  console.log("🚀 Starting Rema 1000 scraper...\n");

  const browser: Browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  const page: Page = await context.newPage();

  console.log("📡 Loading Rema 1000 website...");
  await page.goto("https://shop.rema1000.dk/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  // Wait for the app to load
  await page.waitForTimeout(8000);

  console.log("✅ Page loaded\n");

  // Try to find category links or product elements
  // This will need to be adjusted based on the actual page structure
  console.log("🔍 Searching for products...");

  const products: Product[] = [];
  const seenNames = new Set<string>();

  // Strategy: Navigate through categories and extract products
  // Since this is an SPA, we need to interact with it

  try {
    // Look for category navigation
    const categoryLinks = await page.locator('a[href*="category"], a[href*="kategori"]').all();

    console.log(`Found ${categoryLinks.length} category links\n`);

    for (const link of categoryLinks.slice(0, 10)) {
      const categoryName = await link.textContent();
      console.log(`📦 Processing category: ${categoryName}`);

      await link.click();
      await page.waitForTimeout(3000); // Wait for products to load

      // Extract products from current category
      const productElements = await page.locator('[class*="product"], [class*="Product"], [data-testid*="product"]').all();

      console.log(`   Found ${productElements.length} products`);

      for (const product of productElements.slice(0, 50)) {
        try {
          const nameElement = await product.locator('[class*="name"], [class*="title"], h3, h4').first();
          const rawName = await nameElement.textContent();

          if (rawName) {
            const cleanedName = cleanProductName(rawName);
            const normalizedName = cleanedName.toLowerCase();

            if (isValidProductName(cleanedName) && !seenNames.has(normalizedName)) {
              const category = mapCategory(categoryName || "");
              products.push({
                name: cleanedName,
                category,
                popularity: 100 - products.length, // Descending popularity
              });

              seenNames.add(normalizedName);
              console.log(`   ✓ ${cleanedName} (${category})`);

              if (products.length >= LIMIT) {
                break;
              }
            }
          }
        } catch (err) {
          // Skip problematic products
        }
      }

      if (products.length >= LIMIT) {
        break;
      }

      // Go back to categories
      await page.goBack();
      await page.waitForTimeout(2000);
    }
  } catch (error) {
    console.error("Error during scraping:", error);
  }

  await browser.close();

  return products;
}

/**
 * Export products to CSV
 */
function exportToCSV(products: Product[], outputPath: string) {
  console.log(`\n💾 Exporting ${products.length} products to ${outputPath}...`);

  const csvLines = ["name,category,popularity,aliases"];

  for (const product of products) {
    csvLines.push(`${product.name},${product.category},${product.popularity},""`);
  }

  writeFileSync(outputPath, csvLines.join("\n"), "utf-8");

  console.log(`✅ Export complete!`);
}

/**
 * Main function
 */
async function main() {
  try {
    const products = await scrapeRema1000();

    if (products.length === 0) {
      console.error("❌ No products found. The scraper may need adjustment.");
      process.exit(1);
    }

    exportToCSV(products, OUTPUT_FILE);

    console.log(`\n🎉 Scraping complete!`);
    console.log(`   Products scraped: ${products.length}`);
    console.log(`   Output file: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ Scraping failed:", error);
    process.exit(1);
  }
}

main();
