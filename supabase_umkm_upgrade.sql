-- HAPUS RLS LAMA AGAR TABEL BISA DIHAPUS (CLEANUP BOILERPLATE)
ALTER TABLE IF EXISTS "inventory" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "organization_members" DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "organizations" DISABLE ROW LEVEL SECURITY;

DROP TABLE IF EXISTS "inventory" CASCADE;
DROP TABLE IF EXISTS "organization_members" CASCADE;
DROP TABLE IF EXISTS "organizations" CASCADE;

-- BUAT ENUM BARU UNTUK UMKM
CREATE TYPE "public"."input_method" AS ENUM('MANUAL', 'VOICE', 'OCR');
DROP TYPE IF EXISTS "public"."transaction_type" CASCADE;
CREATE TYPE "public"."transaction_type" AS ENUM('INCOME', 'EXPENSE');

-- BUAT TABEL BUSINESSES (Profil UMKM)
CREATE TABLE "businesses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "owner_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "address" text,
    "category" text DEFAULT 'F&B',
    "latitude_home" numeric(10, 8),
    "longitude_home" numeric(11, 8),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- BUAT TABEL PRODUCTS (Inventory Bahan / Menu UMKM)
CREATE TABLE "products" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "business_id" uuid NOT NULL REFERENCES "public"."businesses"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "price" numeric(15, 2) NOT NULL,
    "current_stock" integer DEFAULT 0 NOT NULL,
    "unit" text,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- UPDATE TABEL USERS UNTUK MENAMBAH NOMOR HP
ALTER TABLE "users" DROP COLUMN IF EXISTS "phone" CASCADE;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phone_number" text UNIQUE;
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");

-- RESTRUKTURISASI TABEL TRANSACTIONS (Support GPS & Input Method AI)
-- Hapus data transaksi lama karena struktur entitasnya (organization) sudah dirombak total
TRUNCATE TABLE "transactions" CASCADE;

ALTER TABLE "transactions" DROP COLUMN IF EXISTS "organization_id" CASCADE;
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "amount" CASCADE;
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "description" CASCADE;
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "source" CASCADE;

ALTER TABLE "transactions" ADD COLUMN "business_id" uuid NOT NULL REFERENCES "public"."businesses"("id") ON DELETE cascade;
ALTER TABLE "transactions" ADD COLUMN "total_amount" numeric(15, 2) DEFAULT 0 NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "input_method" "public"."input_method" DEFAULT 'MANUAL' NOT NULL;
ALTER TABLE "transactions" ADD COLUMN "latitude_captured" numeric(10, 8);
ALTER TABLE "transactions" ADD COLUMN "longitude_captured" numeric(11, 8);
ALTER TABLE "transactions" ADD COLUMN "type" "public"."transaction_type" NOT NULL;

-- BUAT TABEL DETIL TRANSAKSI (Nota Penjualan / Belanja)
CREATE TABLE "transaction_details" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "transaction_id" uuid NOT NULL REFERENCES "public"."transactions"("id") ON DELETE cascade,
    "product_id" uuid NOT NULL REFERENCES "public"."products"("id") ON DELETE restrict,
    "quantity" integer NOT NULL,
    "subtotal" numeric(15, 2) NOT NULL
);

-- BUAT TABEL RECEIPT IMAGES (Untuk Validasi Nota OCR AI)
CREATE TABLE "receipt_images" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "transaction_id" uuid NOT NULL REFERENCES "public"."transactions"("id") ON DELETE cascade,
    "image_url" text NOT NULL,
    "ocr_raw_json" jsonb,
    "confidence_score" real,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- BUAT TABEL CREDIT SCORES (Historis Penilaian Dashboard Analis)
CREATE TABLE "credit_scores" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "business_id" uuid NOT NULL REFERENCES "public"."businesses"("id") ON DELETE cascade,
    "score_value" integer NOT NULL,
    "analysis_notes" text,
    "calculated_at" timestamp DEFAULT now() NOT NULL
);

-- BUAT TABEL STAKEHOLDERS (AKSES KOPERASI / PEMBERI PINJAMAN)
CREATE TABLE "stakeholders" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
    "institution_name" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- BUAT TABEL LINKING STAKEHOLDER & UMKM
CREATE TABLE "stakeholder_businesses" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "stakeholder_id" uuid NOT NULL REFERENCES "public"."stakeholders"("id") ON DELETE cascade,
    "business_id" uuid NOT NULL REFERENCES "public"."businesses"("id") ON DELETE cascade,
    "linked_at" timestamp DEFAULT now() NOT NULL
);

-- TURN ON RLS FOR NEW SECURE TABLES
ALTER TABLE "businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transaction_details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "receipt_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "credit_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "stakeholder_businesses" ENABLE ROW LEVEL SECURITY;