CREATE TABLE "global_grocery_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"category" "grocery_category" NOT NULL,
	"popularity" integer DEFAULT 0 NOT NULL,
	"aliases" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_grocery_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"category" "grocery_category" NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"usage_count" integer DEFAULT 1 NOT NULL,
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"global_item_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_grocery_history" ADD CONSTRAINT "user_grocery_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_grocery_history" ADD CONSTRAINT "user_grocery_history_global_item_id_global_grocery_items_id_fk" FOREIGN KEY ("global_item_id") REFERENCES "public"."global_grocery_items"("id") ON DELETE no action ON UPDATE no action;