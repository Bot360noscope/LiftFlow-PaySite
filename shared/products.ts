export type PricingTier = "free" | "tier_5" | "tier_10" | "tier_25" | "enterprise";

export interface PricingPlan {
  id: PricingTier;
  name: string;
  description: string;
  userCount: number;
  annualPrice: number;
  pricePerUser: number;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
}

export const STRIPE_PRICE_IDS: Record<string, string> = {
  tier_5: "price_1T36oMPEnFRXYYKj2AMO5eq9",
  tier_10: "price_1T36oNPEnFRXYYKjQm3oRPcI",
  tier_25: "price_1T36oNPEnFRXYYKjkGvsTJtW",
  enterprise: "price_1T36oOPEnFRXYYKj1fYlN4yU",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    userCount: 1,
    annualPrice: 0,
    pricePerUser: 0,
    stripePriceId: "",
    features: [
      "1 client included",
      "Basic workout tracking",
      "Progress monitoring",
      "Mobile app access",
    ],
  },
  {
    id: "tier_5",
    name: "Starter",
    description: "For small coaching practices",
    userCount: 5,
    annualPrice: 100,
    pricePerUser: 20,
    stripePriceId: STRIPE_PRICE_IDS.tier_5,
    features: [
      "5 clients included",
      "Everything in Free",
      "Unlimited workout programs",
      "Advanced analytics",
      "Email support",
    ],
    popular: true,
  },
  {
    id: "tier_10",
    name: "Growth",
    description: "Scale your coaching business",
    userCount: 10,
    annualPrice: 175,
    pricePerUser: 17.5,
    stripePriceId: STRIPE_PRICE_IDS.tier_10,
    features: [
      "10 clients included",
      "Everything in Starter",
      "Priority support",
      "Custom branding",
      "Save 12.5% per user",
    ],
  },
  {
    id: "tier_25",
    name: "Professional",
    description: "For established coaches",
    userCount: 25,
    annualPrice: 375,
    pricePerUser: 15,
    stripePriceId: STRIPE_PRICE_IDS.tier_25,
    features: [
      "25 clients included",
      "Everything in Growth",
      "Dedicated account manager",
      "API access",
      "Save 25% per user",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For growing teams",
    userCount: 999,
    annualPrice: 500,
    pricePerUser: 0,
    stripePriceId: STRIPE_PRICE_IDS.enterprise,
    features: [
      "Unlimited users (25+)",
      "Everything in Professional",
      "Custom integrations",
      "SLA guarantee",
      "White-label options",
    ],
  },
];

export function getPricingPlan(tier: PricingTier): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === tier);
}

export function calculateSavings(tier: PricingTier): number {
  const plan = getPricingPlan(tier);
  if (!plan || tier === "free" || tier === "enterprise") return 0;

  const basePricePerUser = 20;
  const actualPricePerUser = plan.pricePerUser;
  const savingsPerUser = basePricePerUser - actualPricePerUser;
  const percentSavings = (savingsPerUser / basePricePerUser) * 100;

  return Math.round(percentSavings);
}
