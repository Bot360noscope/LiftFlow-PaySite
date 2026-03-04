export type PricingTier = "free" | "tier_5" | "tier_10" | "saas";

export interface PricingPlan {
  id: PricingTier;
  name: string;
  description: string;
  userCount: number;
  monthlyPrice: number;
  pricePerUser: number;
  stripePriceId: string;
  features: string[];
  popular?: boolean;
  isPerClient?: boolean;
  minClients?: number;
}

export const STRIPE_PRICE_IDS: Record<string, string> = {
  tier_5: "price_1T53lQGUmlzwoGVCSVpfJJpP",
  tier_10: "price_1T53lrGUmlzwoGVCypLzaH0S",
  saas: "price_1T53nvGUmlzwoGVCFd74Zz1A",
};

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    userCount: 1,
    monthlyPrice: 0,
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
    monthlyPrice: 12.5,
    pricePerUser: 2.5,
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
    monthlyPrice: 20,
    pricePerUser: 2,
    stripePriceId: STRIPE_PRICE_IDS.tier_10,
    features: [
      "10 clients included",
      "Everything in Starter",
      "Priority support",
      "Custom branding",
      "Save 20% per client",
    ],
  },
  {
    id: "saas",
    name: "SaaS",
    description: "$1.50 for clients over 15",
    userCount: 999,
    monthlyPrice: 1.5,
    pricePerUser: 1.5,
    stripePriceId: STRIPE_PRICE_IDS.saas,
    isPerClient: true,
    minClients: 15,
    features: [
      "$1.50 per client over 15",
      "Everything in Growth",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
    ],
  },
];

export function getPricingPlan(tier: PricingTier): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === tier);
}
