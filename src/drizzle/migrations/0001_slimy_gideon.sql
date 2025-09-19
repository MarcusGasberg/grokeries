DO $$ BEGIN
CREATE TYPE "public"."list_role" AS ENUM('owner', 'editor', 'viewer');
EXCEPTION
WHEN duplicate_object THEN null;
END $$;

CREATE TABLE "grocery_list" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grocery_list_members" (
	"user_id" text NOT NULL,
	"list_id" text NOT NULL,
	"role" "list_role" DEFAULT 'viewer' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "grocery_list_members_user_id_list_id_pk" PRIMARY KEY("user_id","list_id")
);
--> statement-breakpoint
ALTER TABLE "grocery" ADD COLUMN "list_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "grocery_list_members" ADD CONSTRAINT "grocery_list_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_members" ADD CONSTRAINT "grocery_list_members_list_id_grocery_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery" ADD CONSTRAINT "grocery_list_id_grocery_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_list"("id") ON DELETE cascade ON UPDATE no action;
