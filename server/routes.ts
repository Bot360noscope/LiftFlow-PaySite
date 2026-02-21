import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { z } from "zod";
import { STRIPE_PRICE_IDS } from "@shared/products";

const LIFTFLOW_API_BASE = "https://new-liftflow-for-render-hosting-backend.onrender.com";

const checkoutInputSchema = z.object({
  tier: z.enum(["tier_5", "tier_10", "saas"]),
  userCount: z.number().min(1),
  coachEmail: z.string().email(),
  userId: z.string().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/verify-account", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const response = await fetch(
        `${LIFTFLOW_API_BASE}/api/verify-account?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("[Verify] Error verifying account:", error.message);
      res.status(500).json({ error: "Unable to verify account at this time" });
    }
  });

  app.post("/api/billing/downgrade-free", async (req, res) => {
    try {
      const { coachEmail } = req.body;
      if (!coachEmail) {
        return res.status(400).json({ error: "Email is required" });
      }

      const stripe = await getUncachableStripeClient();

      const user = await storage.getUserByEmail(coachEmail);
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ success: true, message: "You are already on the Free plan." });
      }

      try {
        await stripe.subscriptions.update(user.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (err: any) {
        console.log("Subscription cancel error (may already be cancelled):", err.message);
      }

      return res.json({
        success: true,
        message: "Your subscription will be cancelled at the end of the billing period. You'll be downgraded to the Free plan.",
      });
    } catch (error: any) {
      console.error("[Billing] Downgrade error:", error);
      res.status(500).json({ error: error.message || "Failed to downgrade" });
    }
  });

  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const input = checkoutInputSchema.parse(req.body);
      const { tier, userCount, coachEmail, userId } = input;

      const stripe = await getUncachableStripeClient();

      const priceId = STRIPE_PRICE_IDS[tier];
      if (!priceId) {
        return res.status(400).json({ error: "Invalid pricing tier or price not configured" });
      }

      if (tier === "saas" && userCount < 15) {
        return res.status(400).json({ error: "SaaS plan requires a minimum of 15 clients" });
      }

      let user = await storage.getUserByEmail(coachEmail);
      if (!user) {
        user = await storage.createUser({ email: coachEmail, name: null });
      }

      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription.status === "active" || subscription.status === "trialing") {
            const quantity = tier === "saas" ? userCount : 1;
            const updatedSubscription = await stripe.subscriptions.update(
              user.stripeSubscriptionId,
              {
                items: [
                  {
                    id: subscription.items.data[0].id,
                    price: priceId,
                    quantity,
                  },
                ],
                proration_behavior: "create_prorations",
                metadata: {
                  tier,
                  userCount: userCount.toString(),
                  coachEmail,
                  userId: userId || "",
                },
              }
            );

            return res.json({
              url: "",
              sessionId: "",
              subscriptionId: updatedSubscription.id,
              message: "Subscription updated successfully. Prorated charges will appear on your next invoice.",
            });
          }
        } catch (subError: any) {
          console.log("Existing subscription not found or inactive, creating new checkout:", subError.message);
        }
      }

      let customer: any;
      if (user.stripeCustomerId) {
        customer = { id: user.stripeCustomerId };
      } else {
        const existingCustomers = await stripe.customers.list({
          email: coachEmail,
          limit: 1,
        });

        if (existingCustomers.data.length > 0) {
          customer = existingCustomers.data[0];
        } else {
          customer = await stripe.customers.create({
            email: coachEmail,
            metadata: {
              userId: userId || user.id,
              coachEmail,
            },
          });
        }
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const quantity = tier === "saas" ? userCount : 1;

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        client_reference_id: userId || coachEmail,
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        subscription_data: {
          metadata: {
            tier,
            userCount: userCount.toString(),
            coachEmail,
            userId: userId || "",
          },
        },
        metadata: {
          tier,
          userCount: userCount.toString(),
          coachEmail,
          userId: userId || "",
        },
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cancel?userId=${userId || ""}&email=${coachEmail}`,
        allow_promotion_codes: true,
      });

      res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (error: any) {
      console.error("[Billing] Checkout error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: error.message || "Failed to create checkout session" });
    }
  });

  app.get("/api/checkout/session/:sessionId", async (req, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);

      if (session.subscription && session.customer_details?.email) {
        const email = session.customer_details.email;
        const user = await storage.getUserByEmail(email);
        if (user && !user.stripeSubscriptionId) {
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
          console.log(`[Session] Saved subscription ${subscriptionId} (tier: ${tier}, users: ${userCount}) for ${email}`);
        }
      }

      res.json({
        status: session.status,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
        subscriptionId: session.subscription,
        tier: session.metadata?.tier,
        userCount: session.metadata?.userCount,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
