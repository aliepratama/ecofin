CREATE TYPE "public"."stakeholder_invite_status" AS ENUM('ACTIVE', 'CLAIMED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "production_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"planned_quantity" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
ALTER TABLE "products" ADD COLUMN "type" text DEFAULT 'MENU' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "ai_recipe" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "min_medium_trust_score" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD COLUMN "min_high_trust_score" integer DEFAULT 70 NOT NULL;--> statement-breakpoint
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_plans" ADD CONSTRAINT "production_plans_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_invites" ADD CONSTRAINT "stakeholder_invites_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_invites" ADD CONSTRAINT "stakeholder_invites_claimed_business_id_businesses_id_fk" FOREIGN KEY ("claimed_business_id") REFERENCES "public"."businesses"("id") ON DELETE set null ON UPDATE no action;