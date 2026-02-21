# LiftFlow Payments

## Overview
A focused payment/purchasing site for LiftFlow (fitness coaching platform) implementing a fixed-tier annual subscription pricing model with Stripe integration.

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
- **External API**: `https://new-liftflow-for-render-hosting-backend.onrender.com/api/verify-account`

## Pricing Tiers (Annual Only)
| Tier | Clients | Price/Year | Price ID |
|------|---------|-----------|----------|
| Free | 1 | $0 | N/A (downgrade cancels subscription) |
| Starter | 5 | $25 | price_1T36vQPEnFRXYYKjTF9txX85 |
| Growth | 10 | $40 | price_1T36vQPEnFRXYYKjlSwccVpP |
| SaaS | 15+ | $3/client | price_1T36vRPEnFRXYYKjkf27939t |

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
- 2026-02-21: Dark theme with orange highlights from LiftFlow app colors.ts
- 2026-02-21: Pricing updated to Free/$0, Starter/$25, Growth/$40, SaaS/$3-per-client (min 15)
- 2026-02-21: Added account verification via main LiftFlow server before purchase
- 2026-02-21: Added Free plan downgrade functionality
- 2026-02-21: SaaS client count selector with min 15 enforcement
