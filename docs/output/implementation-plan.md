# Plan: Ecofin UMKM implementation plan

**Generated**: 2026-04-16
**Estimated Complexity**: High

## Overview
This implementation plan maps the current state of the Ecofin boilerplate project to the requirements defined in the **Ecofin UMKM PRD**. The current project has basic authentication, generic organization abstractions, and minimal UI skeletons. We need to strip out generic SaaS "organization" structures in favor of "business" profiles tuned for F&B UMKM, implement strict data triangulations (Voice, OCR, and GPS), establish a Trust Score dashboard, and ensure a robust offline-first PWA experience with a cleaner, high-contrast, PayPal-inspired UI.

### What should be removed/changed:
- Remove generic generic "organization" and "organization_members" logic and rename/rebuild as `businesses`.
- Remove generic `inventory` table schema and recreate as `products`.
- Update `transactions` to include GPS attributes (`latitude_captured`, `longitude_captured`).
- Remove any existing overly complex generic AI chat and re-focus exclusively to "Voice-to-Ledger" transaction input and "OCR Receipt" validations.

## Prerequisites
- Supabase (PostgreSQL, Auth, Edge Functions/Cron)
- Drizzle ORM
- Google Gemini API (for Voice NLP and generic receipt extraction)
- Next.js App Router (already set up)
- `@ducanh2912/next-pwa` (already in package.json)
- `lucide-react` & `recharts` (for UI and dashboard charting)

---

## Sprint 1: Database Redesign & Auth Adjustments
**Goal**: Restructure the existing database schema to strictly match the PRD's anti-fraud/UMKM-focused entities.
**Demo/Validation**:
- Successfully run `bun run db:generate` and `bun run db:migrate`.
- Database Studio shows the new tables (`businesses`, `products`, `transactions`, `transaction_details`, `receipt_images`, `credit_scores`).

### Task 1.1: Refactor Core Schema Entities
- **Location**: `src/models/Schema.ts`
- **Description**: 
  - Delete `organizations` and `organizationMembers`. Create `businesses` with `latitude_home`, `longitude_home`, and `category`.
  - Update `users` table to track profile data like `phone_number` as unique.
  - Rename `inventory` to `products` with `price`, `current_stock`, and `unit`.
- **Dependencies**: None
- **Acceptance Criteria**: The file accurately reflects the PRD's JSON schema matrix.

### Task 1.2: Add Transaction & Verification Tables
- **Location**: `src/models/Schema.ts`
- **Description**:
  - Update the existing `transactions` table. Add `latitude_captured`, `longitude_captured`, `input_method` enum (`MANUAL`, `VOICE`, `OCR`), and `total_amount`.
  - Create `transaction_details` (linking to `products`).
  - Create `receipt_images` (to store OCR JSON and confidence_score).
  - Create `credit_scores` (to log historical Trust Score calculations).
- **Dependencies**: Task 1.1
- **Acceptance Criteria**: All 7 functional tables exist. 

### Task 1.3: Apply Database Migrations
- **Location**: Terminal
- **Description**: Run Drizzle kit to drop old tables and generate new ones. Wipe any dummy local DB data.
- **Dependencies**: Task 1.2
- **Validation**: Execute `bun run db:migrate` without errors.

---

## Sprint 2: Core Input Mechanisms (Voice, OCR, Manual) & GPS
**Goal**: Build the functional components that allow merchants to input string data (voice), scan receipts, and manually log forms, automatically appending GPS coords to every action.
**Demo/Validation**:
- Users can upload an image/receipt and receive an extracted JSON of their expense.
- Users can speak/type "Laku 10 porsi ayam" and have a transaction correctly logged.
- All actions save GPS coordinates into the local DB.

### Task 2.1: Implement Metadata Verification (GPS Wrapper)
- **Location**: `src/utils/Geolocation.ts` (New), and `src/app/(auth)/manual/page.tsx`
- **Description**: Create a browser hook or utility function to request and fetch `navigator.geolocation` before any form submittal.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**: Accurate `latitude` and `longitude` are passed during `onSubmit`.

### Task 2.2: Smart Receipt Scanner (OCR)
- **Location**: `src/app/(auth)/scan/page.tsx` and `src/app/(auth)/scan/actions.ts`
- **Description**: 
  - UI allows uploading or taking a picture of a receipt.
  - Server Action sends the image to `gemini-service` with prompts tailored to extract item lists and total expenses.
  - Saves the record into `transactions`, `transaction_details`, and `receipt_images`.
- **Dependencies**: Task 2.1
- **Validation**: Picture uploads correctly map to standard expense amounts.

### Task 2.3: Voice-to-Ledger Engine
- **Location**: `src/app/(auth)/chat/page.tsx` and `src/app/(auth)/chat/actions.ts`
- **Description**: 
  - (Assuming the user types or dictates via built-in Keyboard Voice dictation). 
  - Server Action parses NLP input ("laku 5 ayam", "beli beras 200rb") into standard JSON using Google Gemini.
  - Classifies into Income or Expense and calculates product quantity deductions.
- **Dependencies**: Task 2.1

---

## Sprint 3: The Trust Score & Analytics Dashboard
**Goal**: Visualize the collected data based on the PRD's dashboard requirements. Calculate and display the Trust Score.
**Demo/Validation**:
- The dashboard highlights the "Siap Pinjam" (Ready to Loan) Speedometer.
- Charts show 7-day revenue, expense composition, and stock warnings.

### Task 3.1: Trust Score Calculation Logic
- **Location**: `src/libs/scoring/TrustScore.ts` (New)
- **Description**: Implement the weighted formula: `(W1 * Consistency) + (W2 * Validity) + (W3 * Growth)`.
  - Consistency: Count consecutive days logged.
  - Validity: Ratio of `OCR/VOICE` vs `MANUAL` inputs and GPS consistency against `latitude_home`.
- **Dependencies**: Sprint 2

### Task 3.2: Merchant Dashboard UI
- **Location**: `src/app/(auth)/dashboard/page.tsx`
- **Description**: 
  - Install standard charting library (e.g. Recharts).
  - Build the "Gauge Chart" (Speedometer) using Trust Score output.
  - Build "Simple Bar Chart" (Uang Masuk Harian).
  - Build "Donut Chart" (Kue Pengeluaran).
  - Use PayPal-like styling: High-contrast White cards, `border-neutral-200`, `#003087` Action blue.
- **Dependencies**: Task 3.1

---

## Sprint 4: PWA Setup & PDF Export
**Goal**: Make the application robust for offline/low-signal use and allow Kur reporting.
**Demo/Validation**:
- Site installs on Android/iOS via Chrome/Safari.
- PDF downloads containing standardized Laba-Rugi.

### Task 4.1: Progressive Web App Service Workers
- **Location**: `next.config.ts`, `public/manifest.json`
- **Description**: 
  - Configure `@ducanh2912/next-pwa` to cache primary dashboard, scan, and chat routes.
  - Add appropriate offline fallback pages if necessary.
- **Dependencies**: Sprint 3

### Task 4.2: Export Report KUR (PDF Generator)
- **Location**: `src/app/api/export/kur/route.ts`
- **Description**: 
  - Create a server endpoint that aggregates 6-12 months of financial data.
  - Generate an HTML layout of a standardized proxy profit-loss statement and use native browser print or lightweight PDF library (like `react-to-pdf` or generic html-to-pdf API) to download.
- **Dependencies**: Sprint 3
- **Validation**: Endpoint returns a valid `.pdf` buffer.

---

## Sprint 5: UI/UX Evaluation & Accessibility Refinement
**Goal**: Simplify the User Interface to ensure it is intuitively usable for non-tech-savvy (gaptek) users across all age groups, avoiding cognitive overload.
**Demo/Validation**:
- Users can complete core actions (scan, voice input, view score) with max 2-3 clicks.
- UI features high contrast, large readable fonts, and minimal on-screen buttons.

### Task 5.1: Minimalist Navigation & Layout Overhaul
- **Location**: `src/app/layout.tsx`, `src/components/`
- **Description**: 
  - Strip away unnecessary generic SaaS navigation elements.
  - Implement a sticky bottom tab bar (Home, Scan, Voice, Profile) for mobile-first usage.
  - Ensure primary actions (CTA) use high-visibility colors and are thumb-friendly (min 48px height).
- **Dependencies**: Sprint 3 & Sprint 4
- **Acceptance Criteria**: Navigation is reduced to absolute essentials with clear, familiar iconography.

### Task 5.2: Cognitive Load Reduction & Feedback
- **Location**: Global UI elements (`src/components/ui/`)
- **Description**: 
  - Remove redundant buttons and group secondary actions to avoid screen clutter.
  - Add clear visual feedback (loading animations, success/error toast messages using simple, non-teknis language).
  - Enforce larger base typography (e.g., 16px body) and generous spacing to accommodate older users.
- **Dependencies**: Task 5.1
- **Validation**: Concept of "less is more" applied—users are naturally guided to the next step without needing a tutorial.

---

## Sprint 6: Stakeholder (Lender) Portal & Aggregation
**Goal**: Build a dedicated portal for lenders (Koperasi/Banks) to oversee registered UMKM portfolios via aggregated data and allow secure account linking.
**Demo/Validation**:
- A stakeholder can log in, generate a link code/QR, and the merchant can accept it.
- The stakeholder dashboard displays aggregated metrics (Total Revenue, Trust Score average) of linked merchants without exposing raw granular transactions.

### Task 6.1: Stakeholder Schema & Linking Mechanism
- **Location**: `src/models/Schema.ts`, `src/app/(stakeholder)/link/actions.ts`
- **Description**: 
  - Create `stakeholders` table and `stakeholder_businesses` junction table to manage the relationship.
  - Implement an action where stakeholders generate a unique invite code or QR code that merchants can input/scan to securely share their aggregated data.
- **Dependencies**: Sprint 1
- **Acceptance Criteria**: DB handles stakeholder entities and the linking process securely validates and connects both parties.

### Task 6.2: Aggregation API & Data Privacy
- **Location**: `src/app/(stakeholder)/analytics/actions.ts` (Server Actions)
- **Description**: 
  - Create securely scoped db queries that only return aggregated data (total omzet, risk ratio, average Trust Score, validity percentages) for linked businesses.
  - Enforce data privacy logic to block stakeholders from fetching individual transaction details or OCR receipts directly.
- **Dependencies**: Task 6.1, Sprint 3
- **Validation**: Analytics data returns grouped month-over-month insights instead of raw individual logs.

### Task 6.3: Lender Dashboard UI
- **Location**: `src/app/(stakeholder)/dashboard/page.tsx`
- **Description**: 
  - Build the "Credit Analysis Dashboard" (as per PRD).
  - Implement Dual Line Charts for tracking business cash flow trends, Stacked Bar Charts for Validation compositon (Manual vs AI), and Radar Charts for UMKM Risk Profiles.
  - Display a data table of linked merchants sortable by their current Trust Score readiness.
- **Dependencies**: Task 6.2

---

## Testing Strategy
- **Unit Tests**: Ensure Trust Score formula (`TrustScore.ts`) provides correct outputs given mock data edges (e.g., all 0s, perfect scores, invalid GPS).
- **Integration Tests**: Verify Server Actions (`scan/actions.ts`), ensuring DB rollbacks trigger appropriately if the OCR fails saving receipt images.
- **E2E Tests**: Use Playwright (already installed via Checkly residue or fresh) to test the whole path: login → manual input form → dashboard stats update.

## Potential Risks & Gotchas
- **GPS Inaccuracies**: Some phones may return wildly inaccurate coordinates or reject permission. *Mitigation:* Allow form submittals but penalize the "Validity" section of the Trust Score, ensuring merchants aren't strictly blocked.
- **OCR Limitations**: Crumpled or faded receipts are very common in traditional markets. *Mitigation:* The OCR confidence score must be logged. If confidence is `< 50%`, the system should fall back to manual validation and flag it.
- **Drizzle Table Deletion**: Dropping large tables like `organizations` might break `auth.users` trigger defaults in Supabase if not handled with care. Ensure to cascade appropriately in SQL.
- **PWA Caching**: NextJS App Router relies heavily on RSCs (React Server Components), making PWA runtime caching complex. *Mitigation:* Be explicit about client-side data fetching for off-line critical sections.

## Rollback Plan
- Use `bun run db:migrate:down` (if `drizzle-kit` down logic added) or manually revert the `0000_init-db.sql` schema to the boilerplate structure. 
- Source control: git branches to strictly contain Phase 1 vs Phase 2 isolation.