CREATE TYPE "public"."stakeholder_invite_status" AS ENUM('ACTIVE', 'CLAIMED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "stakeholder_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stakeholder_id" uuid NOT NULL,
	"code" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"status" "stakeholder_invite_status" DEFAULT 'ACTIVE' NOT NULL,
	"claimed_business_id" uuid,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stakeholder_invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "stakeholder_invites" ADD CONSTRAINT "stakeholder_invites_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_invites" ADD CONSTRAINT "stakeholder_invites_claimed_business_id_businesses_id_fk" FOREIGN KEY ("claimed_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;