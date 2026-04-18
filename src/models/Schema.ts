import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
  integer,
  jsonb,
  real,
} from "drizzle-orm/pg-core";

// ENUMS
export const transactionTypeEnum = pgEnum("transaction_type", [
  "INCOME",
  "EXPENSE",
]);

export const inputMethodEnum = pgEnum("input_method", [
  "MANUAL",
  "VOICE",
  "OCR",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "synced",
  "pending",
  "failed",
]);

export const stakeholderInviteStatusEnum = pgEnum("stakeholder_invite_status", [
  "ACTIVE",
  "CLAIMED",
  "EXPIRED",
]);

// USERS TABLE
export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").unique(),
  phoneNumber: text("phone_number").unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// BUSINESSES TABLE
export const businesses = pgTable("businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address"),
  category: text("category").default("F&B"),
  latitudeHome: numeric("latitude_home", { precision: 10, scale: 8 }),
  longitudeHome: numeric("longitude_home", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PRODUCTS TABLE
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  price: numeric("price", { precision: 15, scale: 2 }).notNull(),
  currentStock: integer("current_stock").default(0).notNull(),
  unit: text("unit"),
  type: text("type").default("MENU").notNull(),
  aiRecipe: jsonb("ai_recipe").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// PRODUCTION PLANS TABLE
export const productionPlans = pgTable("production_plans", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // Tanggal rencana masak
  plannedQuantity: integer("planned_quantity").default(0).notNull(), // Jumlah yang akan dimasak / ready stock hari itu
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TRANSACTIONS TABLE
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "set null" }),
  type: transactionTypeEnum("type").notNull(),
  totalAmount: numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  inputMethod: inputMethodEnum("input_method").notNull().default("MANUAL"),
  latitudeCaptured: numeric("latitude_captured", { precision: 10, scale: 8 }),
  longitudeCaptured: numeric("longitude_captured", { precision: 11, scale: 8 }),
  date: timestamp("date").defaultNow().notNull(),

  syncStatus: syncStatusEnum("sync_status").default("synced").notNull(),
  clientTimestamp: timestamp("client_timestamp"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// TRANSACTION DETAILS
export const transactionDetails = pgTable("transaction_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  subtotal: numeric("subtotal", { precision: 15, scale: 2 }).notNull(),
});

// RECEIPT IMAGES
export const receiptImages = pgTable("receipt_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  imageUrl: text("image_url").notNull(),
  ocrRawJson: jsonb("ocr_raw_json"),
  confidenceScore: real("confidence_score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// CREDIT SCORES
export const creditScores = pgTable("credit_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  scoreValue: integer("score_value").notNull(),
  analysisNotes: text("analysis_notes"),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

export const stakeholders = pgTable("stakeholders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  institutionName: text("institution_name").notNull(),
  minMediumTrustScore: integer("min_medium_trust_score").default(40).notNull(),
  minHighTrustScore: integer("min_high_trust_score").default(70).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stakeholderBusinesses = pgTable("stakeholder_businesses", {
  id: uuid("id").defaultRandom().primaryKey(),
  stakeholderId: uuid("stakeholder_id")
    .notNull()
    .references(() => stakeholders.id, { onDelete: "cascade" }),
  businessId: uuid("business_id")
    .notNull()
    .references(() => businesses.id, { onDelete: "cascade" }),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
});

export const stakeholderInvites = pgTable("stakeholder_invites", {
  id: uuid("id").defaultRandom().primaryKey(),
  stakeholderId: uuid("stakeholder_id")
    .notNull()
    .references(() => stakeholders.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  status: stakeholderInviteStatusEnum("status").notNull().default("ACTIVE"),
  claimedBusinessId: uuid("claimed_business_id").references(
    () => businesses.id,
    {
      onDelete: "set null",
    },
  ),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
