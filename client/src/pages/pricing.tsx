import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PRICING_PLANS, type PricingTier } from "@shared/products";
import {
  Check,
  ArrowRight,
  Shield,
  Loader2,
  Users,
  Zap,
} from "lucide-react";

export default function Pricing() {
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null);
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email") || "";
  const urlUserId = params.get("userId") || "";

  const actualEmail = email || urlEmail;

  const checkoutMutation = useMutation({
    mutationFn: async ({
      tier,
      userCount,
      coachEmail,
    }: {
      tier: string;
      userCount: number;
      coachEmail: string;
    }) => {
      const res = await apiRequest("POST", "/api/billing/checkout", {
        tier,
        userCount,
        coachEmail,
        userId: urlUserId || undefined,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      } else if (data.message) {
        toast({
          title: "Subscription Updated",
          description: data.message,
        });
        setCheckoutLoading(null);
      }
    },
    onError: (err: any) => {
      toast({
        title: "Checkout Error",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setCheckoutLoading(null);
    },
  });

  const handleSelectPlan = (plan: (typeof PRICING_PLANS)[number]) => {
    if (plan.id === "free") return;

    if (!actualEmail) {
      setSelectedTier(plan.id);
      toast({
        title: "Email Required",
        description: "Please enter your email address to continue.",
      });
      return;
    }

    setCheckoutLoading(plan.id);
    checkoutMutation.mutate({
      tier: plan.id,
      userCount: plan.userCount,
      coachEmail: actualEmail,
    });
  };

  const paidPlans = PRICING_PLANS.filter((p) => p.id !== "free");

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <img
                src="/liftflow-logo.png"
                alt="LiftFlow"
                className="h-8 w-8 rounded-md"
                data-testid="img-logo"
              />
              <span className="text-xl font-bold tracking-tight" data-testid="text-brand-name">
                LiftFlow
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground hidden sm:inline">
                Secured by Stripe
              </span>
            </div>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-primary"
            data-testid="badge-annual"
          >
            <Zap className="w-3 h-3 mr-1" />
            Annual billing — save more with bigger plans
          </Badge>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            data-testid="text-heading"
          >
            Choose the right plan{" "}
            <span className="text-primary">for your practice</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing for fitness coaches. All plans include
            annual billing with volume discounts built in.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-md mx-auto">
          <div className="flex flex-col gap-2">
            <Label htmlFor="coach-email" className="text-sm font-medium">
              Your email address
            </Label>
            <Input
              id="coach-email"
              type="email"
              placeholder="coach@example.com"
              value={email || urlEmail}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {paidPlans.map((plan) => {
              const isPopular = plan.popular;
              const isLoading = checkoutLoading === plan.id;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-200 hover:shadow-md ${
                    isPopular ? "border-primary border-2 shadow-sm" : ""
                  } ${selectedTier === plan.id ? "ring-2 ring-primary" : ""}`}
                  data-testid={`card-plan-${plan.id}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge data-testid="badge-popular">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        {plan.id === "enterprise"
                          ? "25+ users"
                          : `${plan.userCount} users`}
                      </span>
                    </div>
                    <h3
                      className="text-lg font-bold"
                      data-testid={`text-plan-name-${plan.id}`}
                    >
                      {plan.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                    <div className="mt-3">
                      <span
                        className="text-3xl font-extrabold"
                        data-testid={`text-plan-price-${plan.id}`}
                      >
                        ${plan.annualPrice}
                      </span>
                      <span className="text-muted-foreground text-sm ml-1">
                        /year
                      </span>
                    </div>
                    {plan.pricePerUser > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${plan.pricePerUser}/user/year
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col flex-1">
                    <Button
                      className="w-full mb-4"
                      variant={isPopular ? "default" : "outline"}
                      disabled={isLoading}
                      onClick={() => handleSelectPlan(plan)}
                      data-testid={`button-select-${plan.id}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Get Started
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 p-5 rounded-lg border bg-card/50">
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
              <div>
                <h3
                  className="font-semibold text-lg"
                  data-testid="text-free-plan"
                >
                  Free Plan
                </h3>
                <p className="text-sm text-muted-foreground">
                  1 client included — perfect for getting started. No credit
                  card required.
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Always Free
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/liftflow-logo.png"
              alt="LiftFlow"
              className="h-6 w-6 rounded-md"
            />
            <span className="font-semibold">LiftFlow</span>
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LiftFlow. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
