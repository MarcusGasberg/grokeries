ALTER TABLE "global_grocery_items" ALTER COLUMN "aliases" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "global_grocery_items" ALTER COLUMN "aliases" SET DATA TYPE jsonb USING to_jsonb("aliases");