import { readFileSync } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";
import { globalGroceryItems } from "@/schema";
import { db } from "@/drizzle/drizzle";

interface CsvRow {
  name: string;
  category: string;
  popularity: string;
  aliases: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values: string[] = [];
    let currentValue = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = "";
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    return {
      name: values[0],
      category: values[1],
      popularity: values[2],
      aliases: values[3],
    };
  });
}

async function seedLanguage(language: string) {
  console.log(`\n📦 Seeding ${language.toUpperCase()} items...`);

  const csvPath = join(
    process.cwd(),
    "seed-data",
    `global-items-${language}.csv`,
  );

  try {
    const csvContent = readFileSync(csvPath, "utf-8");
    const rows = parseCsv(csvContent);

    console.log(`   Found ${rows.length} items to import`);

    let imported = 0;
    let skipped = 0;

    for (const row of rows) {
      try {
        const aliases = row.aliases
          ? row.aliases.replace(/^"|"$/g, "").split("|")
          : [];

        await db
          .insert(globalGroceryItems)
          .values({
            id: nanoid(),
            name: row.name,
            nameNormalized: row.name.toLowerCase().trim(),
            language,
            category: row.category as any,
            popularity: parseInt(row.popularity, 10),
            aliases,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .onConflictDoNothing();

        imported++;
        if (imported % 20 === 0) {
          console.log(`   Imported ${imported}/${rows.length} items...`);
        }
      } catch (error) {
        console.error(`   Failed to import ${row.name}:`, error);
        skipped++;
      }
    }

    console.log(`   ✅ ${language.toUpperCase()} complete!`);
    console.log(`      Imported: ${imported}`);
    console.log(`      Skipped: ${skipped}`);

    return { imported, skipped };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log(`   ⚠️  No CSV file found for ${language} (${csvPath})`);
      return { imported: 0, skipped: 0 };
    }
    throw error;
  }
}

async function seedGlobalItems() {
  console.log("🌍 Starting global grocery items seed...\n");

  // Supported languages matching SUPPORTED_LANGUAGES from language-utils.ts
  const languages = ["en", "da", "es", "fr", "de", "pt"];

  let totalImported = 0;
  let totalSkipped = 0;

  for (const language of languages) {
    const { imported, skipped } = await seedLanguage(language);
    totalImported += imported;
    totalSkipped += skipped;
  }

  console.log(`\n🎉 All imports complete!`);
  console.log(`   Total imported: ${totalImported}`);
  console.log(`   Total skipped: ${totalSkipped}`);
  console.log(`   Languages processed: ${languages.join(", ")}`);
}

seedGlobalItems()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
