# LiftFlow Payments

## Overview
A focused payment/purchasing site for LiftFlow (fitness coaching platform) implementing a fixed-tier monthly subscription pricing model with Stripe integration.

## Current State
- **Working**: Pricing page with 3 paid tiers + free plan, Stripe Checkout integration, success/cancel pages
- **Theme**: Dark/black (`#0F0F0F`) with orange highlights (`#E8512F`), Inter font — matches LiftFlow mobile app
- **Logo**: `/client/public/liftflow-logo.png` and `/client/public/favicon.svg`
- **Account verification**: Pings main LiftFlow server before allowing purchase

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui (port 5000)
- **Backend**: Express REST API
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Payments**: Stripe integration via Replit connector (`stripe-replit-sync`)
- **Shared**: `shared/products.ts` defines all pricing tiers and Stripe price IDs
- **External API**: `https://new-liftflow-for-render-hosting-backend.onrender.com/api/verify-account` and `/api/update-plan`
- **Plan Sync**: Payment site actively notifies main LiftFlow server via POST `/api/update-plan` on every payment event (with retry logic)

## Pricing Tiers (Monthly)
| Tier | Clients | Price/Mo | Price ID |
|------|---------|----------|----------|
| Free | 1 | $0 | N/A (downgrade cancels subscription) |
| Starter | 5 | $12.50 | price_1T36vQPEnFRXYYKjTF9txX85 |
| Growth | 10 | $20 | price_1T36vQPEnFRXYYKjlSwccVpP |
| SaaS | 15+ | $1.50/client | price_1T36vRPEnFRXYYKjkf27939t |

## Key Files
- `shared/products.ts` - Pricing config and Stripe price IDs
- `shared/schema.ts` - User schema with Stripe fields
- `server/routes.ts` - API routes (checkout, verify, downgrade, session retrieval)
- `server/stripeClient.ts` - Stripe client via Replit connector
- `server/webhookHandlers.ts` - Stripe webhook processing
- `server/index.ts` - Express server with webhook route (raw body before json middleware)
- `client/src/pages/pricing.tsx` - Main pricing page with account verification and SaaS client selector
- `client/src/pages/success.tsx` - Post-checkout success page
- `client/src/pages/cancel.tsx` - Checkout cancelled page

## API Endpoints
- `GET /api/verify-account?email=xxx` - Proxy to main LiftFlow server to verify account exists
- `POST /api/billing/checkout` - Create Stripe checkout session (tier, userCount, coachEmail)
- `POST /api/billing/downgrade-free` - Cancel subscription (downgrade to free)
- `GET /api/checkout/session/:sessionId` - Retrieve checkout session details
- `GET /api/stripe/publishable-key` - Get Stripe publishable key
- `POST /api/stripe/webhook` - Stripe webhook (raw body)

## User Preferences
- Dark theme with orange highlights matching LiftFlow mobile app colors
- Payment-focused pages only (no marketing/landing)
- Account verification required before purchase
- SaaS tier minimum 15 clients
- Free plan shows downgrade option (not "current plan")

## Recent Changes
- 2026-02-21: Added active plan sync — payment site now calls main LiftFlow `/api/update-plan` on every payment event with retry
- 2026-02-21: Pricing halved to Starter/$12.50, Growth/$20, SaaS/$1.50/client (monthly)
- 2026-02-21: Switched from annual to monthly billing display
- 2026-02-21: Dark theme with orange highlights from LiftFlow app colors.ts
- 2026-02-21: Added account verification via main LiftFlow server before purchase
- 2026-02-21: Added Free plan downgrade functionality
- 2026-02-21: SaaS client count selector with min 15 enforcement
