CREATE TYPE "public"."input_method" AS ENUM('MANUAL', 'VOICE', 'OCR');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"category" text DEFAULT 'F&B',
	"latitude_home" numeric(10, 8),
	"longitude_home" numeric(11, 8),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"score_value" integer NOT NULL,
	"analysis_notes" text,
	"calculated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"name" text NOT NULL,
	"price" numeric(15, 2) NOT NULL,
	"current_stock" integer DEFAULT 0 NOT NULL,
	"unit" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "receipt_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"ocr_raw_json" jsonb,
	"confidence_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholder_businesses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stakeholder_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"linked_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stakeholders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"institution_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction_details" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"subtotal" numeric(15, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inventory" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organization_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "organizations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "inventory" CASCADE;--> statement-breakpoint
DROP TABLE "organization_members" CASCADE;--> statement-breakpoint
DROP TABLE "organizations" CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_organization_id_organizations_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."transaction_type";--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('INCOME', 'EXPENSE');--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "type" SET DATA TYPE "public"."transaction_type" USING "type"::"public"."transaction_type";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "business_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "total_amount" numeric(15, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "input_method" "input_method" DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "latitude_captured" numeric(10, 8);--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "longitude_captured" numeric(11, 8);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone_number" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_scores" ADD CONSTRAINT "credit_scores_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_images" ADD CONSTRAINT "receipt_images_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_businesses" ADD CONSTRAINT "stakeholder_businesses_stakeholder_id_stakeholders_id_fk" FOREIGN KEY ("stakeholder_id") REFERENCES "public"."stakeholders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholder_businesses" ADD CONSTRAINT "stakeholder_businesses_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stakeholders" ADD CONSTRAINT "stakeholders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_details" ADD CONSTRAINT "transaction_details_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "organization_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "amount";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "source";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "phone";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number");--> statement-breakpoint
DROP TYPE "public"."transaction_source";