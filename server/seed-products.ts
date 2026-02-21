import { getUncachableStripeClient } from "./stripeClient";

async function setupFixedTierProducts() {
  const stripe = await getUncachableStripeClient();
  console.log("Setting up LiftFlow fixed tier products and prices...\n");

  const tiers = [
    {
      name: "LiftFlow Starter (5 users)",
      description: "Perfect for small coaching practices - 5 clients included",
      price: 10000,
      users: 5,
      key: "tier_5",
    },
    {
      name: "LiftFlow Growth (10 users)",
      description: "Scale your coaching business - 10 clients included",
      price: 17500,
      users: 10,
      key: "tier_10",
    },
    {
      name: "LiftFlow Professional (25 users)",
      description: "For established coaches - 25 clients included",
      price: 37500,
      users: 25,
      key: "tier_25",
    },
    {
      name: "LiftFlow Enterprise",
      description: "Unlimited users for growing teams (25+)",
      price: 50000,
      users: 999,
      key: "enterprise",
    },
  ];

  const priceIds: Record<string, string> = {};

  for (const tier of tiers) {
    const existing = await stripe.products.search({
      query: `name:'${tier.name}'`,
    });

    if (existing.data.length > 0) {
      console.log(`${tier.name} already exists, fetching price...`);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      if (prices.data.length > 0) {
        priceIds[tier.key] = prices.data[0].id;
      }
      continue;
    }

    console.log(`Creating product: ${tier.name}...`);

    const product = await stripe.products.create({
      name: tier.name,
      description: tier.description,
      metadata: {
        tier: tier.key,
        userCount: tier.users.toString(),
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.price,
      currency: "usd",
      recurring: {
        interval: "year",
      },
      metadata: {
        tier: tier.key,
        userCount: tier.users.toString(),
      },
    });

    console.log(`  Created: ${product.id} | price: ${price.id}`);
    priceIds[tier.key] = price.id;
  }

  console.log("\n=== Stripe Price IDs ===");
  console.log("Update these in shared/products.ts:\n");
  for (const [key, priceId] of Object.entries(priceIds)) {
    console.log(`  ${key}: "${priceId}",`);
  }
  console.log("\nDone!");
}

setupFixedTierProducts().catch(console.error);
