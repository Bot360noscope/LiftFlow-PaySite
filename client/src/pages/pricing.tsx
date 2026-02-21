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
  ArrowDown,
  Shield,
  Loader2,
  Users,
  Zap,
  Minus,
  Plus,
  AlertCircle,
} from "lucide-react";

export default function Pricing() {
  const [email, setEmail] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState<{
    exists: boolean;
    profileId?: string;
    plan?: string;
    name?: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [saasClientCount, setSaasClientCount] = useState(15);
  const { toast } = useToast();

  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email") || "";
  const urlUserId = params.get("userId") || "";

  const actualEmail = email || urlEmail;

  const verifyAccount = async (emailToVerify: string) => {
    setVerifying(true);
    setVerifyError("");
    setVerified(null);
    try {
      const res = await fetch(
        `/api/verify-account?email=${encodeURIComponent(emailToVerify)}`
      );
      const data = await res.json();
      if (data.error) {
        setVerifyError("Unable to verify your account right now. Please try again.");
        setVerified(null);
      } else {
        setVerified(data);
        if (!data.exists) {
          setVerifyError(
            "No LiftFlow account found with this email. Please sign up first."
          );
        }
      }
    } catch {
      setVerifyError("Unable to verify your account right now. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleEmailSubmit = () => {
    if (!actualEmail) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
      });
      return;
    }
    verifyAccount(actualEmail);
  };

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
        userId: urlUserId || verified?.profileId || undefined,
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

  const downgradeMutation = useMutation({
    mutationFn: async (coachEmail: string) => {
      const res = await apiRequest("POST", "/api/billing/downgrade-free", {
        coachEmail,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Downgraded",
        description: data.message,
      });
      setCheckoutLoading(null);
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      });
      setCheckoutLoading(null);
    },
  });

  const handleSelectPlan = (plan: (typeof PRICING_PLANS)[number]) => {
    if (!verified?.exists) {
      toast({
        title: "Verify Your Account",
        description:
          "Please enter your email and verify your account before selecting a plan.",
      });
      return;
    }

    if (plan.id === "free") {
      setCheckoutLoading("free");
      downgradeMutation.mutate(actualEmail);
      return;
    }

    const userCount =
      plan.id === "saas" ? saasClientCount : plan.userCount;

    setCheckoutLoading(plan.id);
    checkoutMutation.mutate({
      tier: plan.id,
      userCount,
      coachEmail: actualEmail,
    });
  };

  const canInteract = verified?.exists === true;

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
          <div className="flex flex-col gap-3">
            <Label htmlFor="coach-email" className="text-sm font-medium">
              Verify your LiftFlow account
            </Label>
            <div className="flex gap-2">
              <Input
                id="coach-email"
                type="email"
                placeholder="coach@example.com"
                value={email || urlEmail}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setVerified(null);
                  setVerifyError("");
                }}
                className="bg-card border-border flex-1"
                data-testid="input-email"
              />
              <Button
                onClick={handleEmailSubmit}
                disabled={verifying || !actualEmail}
                variant="default"
                data-testid="button-verify"
              >
                {verifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            {verifyError && (
              <div
                className="flex items-center gap-2 text-sm text-destructive"
                data-testid="text-verify-error"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyError}</span>
              </div>
            )}
            {verified?.exists && (
              <div
                className="flex items-center gap-2 text-sm text-green-500"
                data-testid="text-verify-success"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>
                  Account verified
                  {verified.name ? ` — Welcome back, ${verified.name}!` : "!"}
                  {verified.plan ? ` (Current plan: ${verified.plan})` : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div
            className={`grid sm:grid-cols-2 lg:grid-cols-4 gap-5 transition-opacity duration-300 ${
              canInteract ? "opacity-100" : "opacity-50 pointer-events-none"
            }`}
            data-testid="pricing-grid"
          >
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
                            ? `${plan.minClients}+ clients`
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
                      ) : isSaaS ? (
                        <>
                          <span
                            className="text-3xl font-extrabold"
                            data-testid={`text-plan-price-${plan.id}`}
                          >
                            ${plan.annualPrice}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            /client/year
                          </span>
                        </>
                      ) : (
                        <>
                          <span
                            className="text-3xl font-extrabold"
                            data-testid={`text-plan-price-${plan.id}`}
                          >
                            ${plan.annualPrice}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            /year
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
                    {isSaaS && (
                      <div className="mb-4 p-3 rounded-lg bg-background border border-border">
                        <Label className="text-xs text-muted-foreground mb-2 block">
                          Number of clients (min {plan.minClients})
                        </Label>
                        <div className="flex items-center justify-between gap-3">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            disabled={saasClientCount <= (plan.minClients || 15)}
                            onClick={() =>
                              setSaasClientCount((c) =>
                                Math.max(plan.minClients || 15, c - 1)
                              )
                            }
                            data-testid="button-saas-minus"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            min={plan.minClients || 15}
                            value={saasClientCount}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const min = plan.minClients || 15;
                              if (raw === "") {
                                setSaasClientCount(min);
                                return;
                              }
                              const val = parseInt(raw);
                              if (!isNaN(val)) {
                                setSaasClientCount(Math.max(min, val));
                              }
                            }}
                            onBlur={() => {
                              setSaasClientCount((c) =>
                                Math.max(plan.minClients || 15, c)
                              );
                            }}
                            className="text-center h-8 bg-card font-bold text-lg"
                            data-testid="input-saas-clients"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => setSaasClientCount((c) => c + 1)}
                            data-testid="button-saas-plus"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <p
                          className="text-xs text-center mt-2 text-primary font-medium"
                          data-testid="text-saas-total"
                        >
                          Total: ${saasClientCount * plan.annualPrice}/year
                        </p>
                      </div>
                    )}

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
                        <>
                          <ArrowDown className="mr-2 w-4 h-4" />
                          Downgrade to Free
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
          {!canInteract && (
            <p
              className="text-center text-sm text-muted-foreground mt-4"
              data-testid="text-verify-prompt"
            >
              Please verify your email above to select a plan.
            </p>
          )}
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
