CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'declined', 'expired');--> statement-breakpoint
CREATE TABLE "grocery_list_invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"list_id" text NOT NULL,
	"inviter_id" text NOT NULL,
	"invitee_email" text NOT NULL,
	"role" "list_role" DEFAULT 'viewer' NOT NULL,
	"invited_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "invitation_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "grocery_list_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "grocery" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "grocery_list" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grocery_list_invitations" ADD CONSTRAINT "grocery_list_invitations_list_id_grocery_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."grocery_list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grocery_list_invitations" ADD CONSTRAINT "grocery_list_invitations_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;