import Stripe from 'stripe';

function getStripeKeys() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  if (!publishableKey) {
    throw new Error('STRIPE_PUBLISHABLE_KEY environment variable is required');
  }

  return { secretKey, publishableKey };
}

export async function getUncachableStripeClient() {
  const { secretKey } = getStripeKeys();
  return new Stripe(secretKey);
}

export async function getStripePublishableKey() {
  const { publishableKey } = getStripeKeys();
  return publishableKey;
}

export async function getStripeSecretKey() {
  const { secretKey } = getStripeKeys();
  return secretKey;
}
