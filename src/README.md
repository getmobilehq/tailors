# TailorSpace - Clothing Alterations Marketplace

A full-stack Next.js application for booking clothing alterations in Nottingham, UK. Expert runners collect items and take measurements at your door, tailors complete the work, and runners deliver finished garments back.

## Features

### Customer Experience
- Browse services with transparent fixed pricing
- Add items to cart with photos and descriptions
- Schedule convenient pickup times (morning/afternoon/evening)
- Secure payment via Stripe
- Track order status in real-time
- View measurements and progress updates

### Runner Dashboard
- View available jobs and accept pickups
- Access customer contact info and addresses
- Record measurements during collection
- Mark items as collected and delivered
- Track completed jobs and ratings

### Admin Panel
- Manage all orders and their status
- Assign runners and tailors to orders
- View business metrics (revenue, active orders, users)
- Add admin notes to orders
- Monitor order flow through different stages

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **State Management**: Zustand (cart)
- **Form Validation**: Zod

## Database Schema

The application uses the following tables:

- **users** - User accounts with role-based access (customer, runner, tailor, admin)
- **services** - Alteration services with fixed pricing
- **orders** - Customer orders with status tracking
- **order_items** - Individual items within an order
- **payments** - Payment records linked to Stripe
- **runner_profiles** - Runner-specific data (capacity, ratings)
- **tailor_profiles** - Tailor-specific data (specializations, capacity)
- **messages** - Order-related messaging
- **reviews** - Customer reviews for completed orders

## Setup Instructions

### 1. Database Setup

1. Create a new Supabase project at https://supabase.com
2. Run the database schema SQL (you'll need to execute this in Supabase SQL Editor):
   - Create all tables listed in the schema
   - Set up Row Level Security (RLS) policies
   - Insert seed data for services

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your test API keys from the Stripe Dashboard
3. Set up a webhook endpoint pointing to: `https://yourdomain.com/api/webhooks/stripe`
4. Select the event: `checkout.session.completed`
5. Copy the webhook signing secret

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/app
  /(marketing)      - Public marketing pages (home, pricing, how it works)
  /(auth)           - Authentication pages (login, signup)
  /(dashboard)      - Protected pages (orders, runner, admin)
  /book             - Multi-step booking flow
  /api              - API routes (checkout, webhooks, runner actions)
/components
  /ui               - shadcn/ui components
  /layout           - Header, footer, navigation
  /booking          - Booking flow components
  /orders           - Order display components
  /runner           - Runner-specific components
  /admin            - Admin-specific components
/lib
  /supabase         - Supabase client configuration
  constants.ts      - App-wide constants
  types.ts          - TypeScript interfaces
  utils.ts          - Utility functions
  validations.ts    - Zod schemas
/hooks              - Custom React hooks (cart, user)
```

## Key Features Implementation

### Booking Flow
1. **Service Selection** (`/book`) - Browse and add services to cart
2. **Item Details** (`/book/items`) - Describe garments and add photos
3. **Schedule Pickup** (`/book/schedule`) - Choose date and time slot
4. **Checkout** (`/book/checkout`) - Enter address and pay via Stripe
5. **Success** (`/book/success`) - Confirmation page

### Order States
- **booked** - Order placed, awaiting runner assignment
- **pickup_scheduled** - Runner assigned, awaiting collection
- **collected** - Items collected by runner
- **in_progress** - Tailor working on alterations
- **ready** - Work completed, ready for delivery
- **out_for_delivery** - Runner delivering items
- **delivered** - Items delivered to customer
- **completed** - Order fully completed

### Role-Based Access
- Middleware enforces role-based routing
- Different dashboards for each user type
- RLS policies protect data at database level

## Service Areas

Currently serving Nottingham postcodes:
- NG1, NG2, NG3, NG5, NG7, NG9

## Pricing Model

- Fixed price per service (e.g., £14 for trouser hemming)
- Flat £7 pickup & delivery fee per order
- No hidden fees or surprises
- Payment required upfront

## Development Notes

### Adding New Services
1. Insert into `services` table via Supabase
2. Assign to appropriate category
3. Set sort_order for display position

### Testing Payments
Use Stripe test cards:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

### Creating Test Users
Use signup page or Supabase dashboard to create users with different roles:
- Customer (default)
- Runner
- Tailor
- Admin

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Stripe Webhooks in Production
Update the webhook URL to your production domain:
`https://yourdomain.com/api/webhooks/stripe`

## Support

For issues or questions about the application architecture, refer to the code comments and TypeScript types.

## License

Proprietary - TailorSpace
