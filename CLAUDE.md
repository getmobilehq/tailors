# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TailorSpace Marketplace is a Next.js application for booking clothing alterations in Nottingham, UK. The platform connects customers with expert runners (who collect items and take measurements) and tailors (who perform alterations).

**Tech Stack:**
- Next.js 14+ with App Router (TypeScript)
- Vite (for development/build - note: uses Vite instead of standard Next.js build)
- Supabase (PostgreSQL + Auth)
- Stripe (payments)
- Tailwind CSS v4 + shadcn/ui
- Zustand (cart state management)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (Vite runs on port 3000)
npm run dev

# Build for production
npm run build
```

**Note:** This project uses Vite instead of the standard Next.js dev server. The dev server runs at http://localhost:3000 and auto-opens in browser.

## Environment Setup

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Database Setup

The database schema is in `/src/supabase/schema.sql`. To set up:

1. Create a Supabase project
2. Run the schema SQL in Supabase SQL Editor
3. This creates all tables with RLS policies and seeds 23 alteration services

Key tables: `users`, `services`, `orders`, `order_items`, `payments`, `runner_profiles`, `tailor_profiles`, `messages`, `reviews`

## Architecture

### Path Aliases

Uses `@/` alias pointing to `./src/` (configured in tsconfig.json and vite.config.ts)

### App Directory Structure

```
/app
  /(marketing)      - Public pages (home, pricing, how-it-works)
  /(auth)           - Login/signup
  /(dashboard)      - Protected: /orders (customer), /runner, /admin
  /book             - Multi-step booking flow (services → items → schedule → checkout → success)
  /api              - API routes (checkout, webhooks, runner actions)
```

### Key Components Organization

- `/components/ui` - shadcn/ui components
- `/components/booking` - Booking flow components
- `/components/orders` - Order display components
- `/components/runner` - Runner-specific components
- `/components/admin` - Admin components
- `/components/layout` - Header, footer, navigation

### State Management

**Cart:** Zustand store with localStorage persistence (`/hooks/use-cart.ts`)
- Manages cart items during booking flow
- Calculates subtotal and total (with £7 delivery fee)
- Key methods: `addItem`, `updateItem`, `removeItem`, `clearCart`

**User:** Custom hook (`/hooks/use-user.ts`) for accessing current user and role

### Authentication & Authorization

**Middleware** (`/middleware.ts`):
- Protects routes: `/orders`, `/runner`, `/tailor`, `/admin`, `/settings`
- Role-based access control (redirects users without proper role)
- Redirects authenticated users away from `/login` and `/signup`

**Roles:** `customer`, `runner`, `tailor`, `admin` (defined in `/lib/types.ts`)

### Booking Flow

5-step process in `/app/book`:
1. **Service Selection** (`/book`) - Browse services, add to cart
2. **Item Details** (`/book/items`) - Describe garments, add photos
3. **Schedule Pickup** (`/book/schedule`) - Choose date and time slot (morning/afternoon/evening)
4. **Checkout** (`/book/checkout`) - Enter address, Stripe payment
5. **Success** (`/book/success`) - Confirmation

### Order Lifecycle

**Order statuses** (see `/lib/types.ts`):
`booked` → `pickup_scheduled` → `collected` → `in_progress` → `ready` → `out_for_delivery` → `delivered` → `completed`

**Runner workflow:**
- Accept jobs from available list
- Collect items and record measurements at customer's door
- Mark as collected
- Deliver finished items back to customer

### API Routes

- `/api/checkout` - Creates Stripe checkout session
- `/api/webhooks/stripe` - Handles Stripe webhook (checkout.session.completed)
- `/api/runner/accept` - Runner accepts a job

### Testing

**Stripe test cards:**
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

**Creating test users:**
1. Sign up via `/signup` (defaults to customer role)
2. Change role in Supabase Table Editor → users table
3. For runners/tailors, also create profile records (see `/src/QUICK_START.md` for SQL)

**Service area:** Nottingham postcodes NG1, NG2, NG3, NG5, NG7, NG9

## Important Notes

- **Vite configuration** (`vite.config.ts`) includes extensive package alias mappings due to versioned imports
- **TypeScript types** are in `/lib/types.ts` - reference these for data structure
- **Constants** (like DELIVERY_FEE) are in `/lib/constants.ts`
- **Validations** (Zod schemas) are in `/lib/validations.ts`
- **RLS policies** protect data at database level - check Supabase if permission errors occur
- The project was originally designed in Figma (link in README.md)

## Deployment

Recommended: Vercel
- Add all environment variables
- Update Stripe webhook URL to production domain
- Update Supabase Auth URL configuration with production domain
