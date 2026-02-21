import Stripe from 'stripe';
import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

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
        if (email) {
          const user = await storage.getUserByEmail(email);
          if (user && session.subscription) {
            const subscriptionId = typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
            const customerId = typeof session.customer === 'string'
              ? session.customer
              : session.customer?.id;
            const tier = session.metadata?.tier || null;
            const userCount = session.metadata?.userCount ? parseInt(session.metadata.userCount) : null;
            await storage.updateUserStripeInfo(user.id, {
              stripeSubscriptionId: subscriptionId,
              stripeCustomerId: customerId || undefined,
              tier: tier || undefined,
              userCount: userCount || undefined,
            });
          }
        }
        console.log(`[Webhook] Checkout completed for ${email}`);
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription ${subscription.id} updated: ${subscription.status}`);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`[Webhook] Subscription ${subscription.id} cancelled`);
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  }
}
