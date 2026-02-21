import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { z } from "zod";
import { STRIPE_PRICE_IDS } from "@shared/products";

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

  app.post("/api/billing/checkout", async (req, res) => {
    try {
      const input = checkoutInputSchema.parse(req.body);
      const { tier, userCount, coachEmail, userId } = input;

      const stripe = await getUncachableStripeClient();

      const priceId = STRIPE_PRICE_IDS[tier];
      if (!priceId) {
        return res.status(400).json({ error: "Invalid pricing tier or price not configured" });
      }

      let user = await storage.getUserByEmail(coachEmail);
      if (!user) {
        user = await storage.createUser({ email: coachEmail, name: null });
      }

      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          if (subscription.status === "active" || subscription.status === "trialing") {
            const updatedSubscription = await stripe.subscriptions.update(
              user.stripeSubscriptionId,
              {
                items: [
                  {
                    id: subscription.items.data[0].id,
                    price: priceId,
                    quantity: 1,
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

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customer.id,
        client_reference_id: userId || coachEmail,
        line_items: [
          {
            price: priceId,
            quantity: 1,
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
      res.json({
        status: session.status,
        customerEmail: session.customer_details?.email,
        customerName: session.customer_details?.name,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
