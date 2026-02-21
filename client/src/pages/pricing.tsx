import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PRICING_PLANS } from "@shared/products";
import {
  Check,
  ArrowRight,
  Shield,
  Loader2,
  Users,
  Zap,
} from "lucide-react";

export default function Pricing() {
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
    if (plan.id === "free") {
      toast({
        title: "Free Plan",
        description:
          "You're on the Free plan by default. No action needed!",
      });
      return;
    }

    if (!actualEmail) {
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

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/90 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <div className="flex items-center gap-3">
              <img
                src="/liftflow-logo.png"
                alt="LiftFlow"
                className="h-8 w-8 rounded-lg"
                data-testid="img-logo"
              />
              <span
                className="text-xl font-bold tracking-tight"
                data-testid="text-brand-name"
              >
                LiftFlow
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">
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
            className="mb-4 border-primary/40 text-primary"
            data-testid="badge-annual"
          >
            <Zap className="w-3 h-3 mr-1" />
            Annual billing
          </Badge>
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            data-testid="text-heading"
          >
            Choose the right plan{" "}
            <span className="text-primary">for your practice</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Simple, transparent pricing for fitness coaches. Start free,
            upgrade when you're ready.
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
              className="bg-card border-border"
              data-testid="input-email"
            />
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING_PLANS.map((plan) => {
              const isFree = plan.id === "free";
              const isPopular = plan.popular;
              const isLoading = checkoutLoading === plan.id;
              const isSaaS = plan.isPerClient;

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col transition-all duration-200 hover:border-primary/50 ${
                    isPopular
                      ? "border-primary border-2 shadow-[0_0_20px_rgba(232,81,47,0.15)]"
                      : "border-border"
                  }`}
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
                        {isFree
                          ? "1 client"
                          : isSaaS
                            ? "Unlimited"
                            : `${plan.userCount} clients`}
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
                      {isFree ? (
                        <span
                          className="text-3xl font-extrabold"
                          data-testid={`text-plan-price-${plan.id}`}
                        >
                          $0
                        </span>
                      ) : (
                        <>
                          <span
                            className="text-3xl font-extrabold"
                            data-testid={`text-plan-price-${plan.id}`}
                          >
                            ${plan.annualPrice}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            {isSaaS ? "/client/year" : "/year"}
                          </span>
                        </>
                      )}
                    </div>
                    {!isFree && !isSaaS && plan.pricePerUser > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ${plan.pricePerUser}/client/year
                      </p>
                    )}
                  </CardHeader>
                  <CardContent className="p-5 pt-0 flex flex-col flex-1">
                    <Button
                      className={`w-full mb-4 ${
                        isFree
                          ? "border-border text-foreground hover:bg-secondary"
                          : ""
                      }`}
                      variant={
                        isFree ? "outline" : isPopular ? "default" : "outline"
                      }
                      disabled={isLoading}
                      onClick={() => handleSelectPlan(plan)}
                      data-testid={`button-select-${plan.id}`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : isFree ? (
                        "Current Plan"
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
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 px-4 sm:px-6 lg:px-8">
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
