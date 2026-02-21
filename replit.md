# LiftFlow Payments

## Overview
A focused payment/purchasing site for LiftFlow (fitness coaching platform) implementing a fixed-tier annual subscription pricing model with Stripe integration.

## Current State
- **Working**: Pricing page with 4 paid tiers + free plan, Stripe Checkout integration, success page
- **Theme**: LiftFlow green (`#16a34a` / HSL 142 71% 45%), Inter font
- **Logo**: `/client/public/liftflow-logo.png` and `/client/public/favicon.svg`

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (port 5000)
- **Backend**: Express REST API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Payments**: Stripe integration via Replit connector (`stripe-replit-sync`)
- **Shared**: `shared/products.ts` defines all pricing tiers and Stripe price IDs

## Pricing Tiers (Annual Only)
| Tier | Users | Price/Year | Price ID |
|------|-------|-----------|----------|
| Free | 1 | $0 | N/A |
| Starter | 5 | $100 | price_1T36oMPEnFRXYYKj2AMO5eq9 |
| Growth | 10 | $175 | price_1T36oNPEnFRXYYKjQm3oRPcI |
| Professional | 25 | $375 | price_1T36oNPEnFRXYYKjkGvsTJtW |
| Enterprise | 25+ | $500 | price_1T36oOPEnFRXYYKj1fYlN4yU |

## Key Files
- `shared/products.ts` - Pricing config and Stripe price IDs
- `shared/schema.ts` - User schema with Stripe fields
- `server/routes.ts` - API routes (checkout, session retrieval)
- `server/stripeClient.ts` - Stripe client via Replit connector
- `server/webhookHandlers.ts` - Stripe webhook processing
- `server/index.ts` - Express server with webhook route (raw body before json middleware)
- `client/src/pages/pricing.tsx` - Main pricing page
- `client/src/pages/success.tsx` - Post-checkout success page

## API Endpoints
- `POST /api/billing/checkout` - Create Stripe checkout session (tier, userCount, coachEmail)
- `GET /api/checkout/session/:sessionId` - Retrieve checkout session details
- `GET /api/stripe/publishable-key` - Get Stripe publishable key
- `POST /api/stripe/webhook` - Stripe webhook (raw body)

## Recent Changes
- 2026-02-21: Rebuilt to match LiftFlow reference app with green theme, logo, fixed-tier pricing
- Seeded 4 Stripe products with annual recurring prices
- Simplified from marketing site to payment-focused pages only
