import { readFileSync } from "fs";
import { join } from "path";
import { nanoid } from "nanoid";
import { globalGroceryItems } from "@/schema";
import db from "@/drizzle/drizzle";

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

async function seedGlobalItems() {
  console.log("Starting global grocery items seed...");

  const csvPath = join(process.cwd(), "seed-data", "global-items-en.csv");
  const csvContent = readFileSync(csvPath, "utf-8");
  const rows = parseCsv(csvContent);

  console.log(`Found ${rows.length} items to import`);

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
          language: "en",
          category: row.category as any,
          popularity: parseInt(row.popularity, 10),
          aliases,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();

      imported++;
      if (imported % 10 === 0) {
        console.log(`Imported ${imported}/${rows.length} items...`);
      }
    } catch (error) {
      console.error(`Failed to import ${row.name}:`, error);
      skipped++;
    }
  }

  console.log(`✅ Import complete!`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped: ${skipped}`);
}

seedGlobalItems()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
