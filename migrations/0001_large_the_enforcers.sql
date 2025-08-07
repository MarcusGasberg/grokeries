CREATE TABLE "grocery" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"author_id" text
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "todo" CASCADE;--> statement-breakpoint
ALTER TABLE "grocery" ADD CONSTRAINT "grocery_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;