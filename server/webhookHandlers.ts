import Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

const LIFTFLOW_API_BASE = "https://new-liftflow-for-render-hosting-backend.onrender.com";

async function notifyLiftFlowPlanUpdate(email: string, tier: string, userCount: number, retryCount = 0): Promise<void> {
  const MAX_RETRIES = 2;
  try {
    const webhookSecret = process.env.LIFTFLOW_WEBHOOK_SECRET;
    const response = await fetch(`${LIFTFLOW_API_BASE}/api/webhooks/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookSecret, email, tier, userCount }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[LiftFlow Sync] Non-OK response (${response.status}) for ${email}: ${text}`);
      if (retryCount < MAX_RETRIES) {
        console.log(`[LiftFlow Sync] Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
        await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
        return notifyLiftFlowPlanUpdate(email, tier, userCount, retryCount + 1);
      }
      return;
    }

    const data = await response.json();
    console.log(`[LiftFlow Sync] Success for ${email}: tier=${tier}, userCount=${userCount}, response:`, data);
  } catch (error: any) {
    console.error(`[LiftFlow Sync] Failed to notify LiftFlow for ${email}:`, error.message);
    if (retryCount < MAX_RETRIES) {
      console.log(`[LiftFlow Sync] Retrying (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
      return notifyLiftFlowPlanUpdate(email, tier, userCount, retryCount + 1);
    }
  }
}

export { notifyLiftFlowPlanUpdate };

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET environment variable is required');
    }

    const stripe = await getUncachableStripeClient();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email || session.metadata?.coachEmail;
        const tier = session.metadata?.tier || null;
        const userCount = session.metadata?.userCount ? parseInt(session.metadata.userCount) : null;

        console.log(`[Webhook] checkout.session.completed - email: ${email}, tier: ${tier}, userCount: ${userCount}`);

        if (email) {
          const user = await storage.getUserByEmail(email);
          if (user && session.subscription) {
            const subscriptionId = typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
            const customerId = typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id;
            await storage.updateUserStripeInfo(user.id, {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId || undefined,
              tier: tier || undefined,
              userCount: userCount || undefined,
            });
            console.log(`[Webhook] Saved subscription ${subscriptionId} for ${email} (tier: ${tier}, users: ${userCount})`);
          }

          if (tier && userCount) {
            await notifyLiftFlowPlanUpdate(email, tier, userCount);
          } else {
            console.warn(`[Webhook] Missing tier (${tier}) or userCount (${userCount}) for ${email} — cannot sync to LiftFlow`);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const tier = subscription.metadata?.tier || null;
        const userCount = subscription.metadata?.userCount ? parseInt(subscription.metadata.userCount) : null;
        const email = subscription.metadata?.coachEmail || null;

        console.log(`[Webhook] subscription.updated - id: ${subscription.id}, status: ${subscription.status}, tier: ${tier}, userCount: ${userCount}, email: ${email}`);

        if (email && tier && userCount && (subscription.status === 'active' || subscription.status === 'trialing')) {
          await notifyLiftFlowPlanUpdate(email, tier, userCount);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const email = subscription.metadata?.coachEmail || null;

        console.log(`[Webhook] subscription.deleted - id: ${subscription.id}, email: ${email}`);

        if (email) {
          await notifyLiftFlowPlanUpdate(email, 'free', 1);
        }
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  }
}
