import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Success() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (sessionId) {
      fetch(`/api/checkout/session/${sessionId}`)
        .then((r) => r.json())
        .then((data) => {
          setSession(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="border-b bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <Link href="/pricing">
              <div className="flex items-center gap-3 cursor-pointer">
                <img
                  src="/liftflow-logo.png"
                  alt="LiftFlow"
                  className="h-8 w-8 rounded-md"
                />
                <span className="text-xl font-bold tracking-tight">
                  LiftFlow
                </span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <PartyPopper className="w-5 h-5 text-primary" />
                <h1
                  className="text-2xl sm:text-3xl font-bold"
                  data-testid="text-success-heading"
                >
                  Welcome to LiftFlow!
                </h1>
              </div>
              <p className="text-muted-foreground mt-2 leading-relaxed">
                Your subscription is now active. You're all set to start
                coaching your clients with LiftFlow.
              </p>

              {loading ? (
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-48 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                </div>
              ) : session ? (
                <div className="mt-6 p-4 rounded-md bg-muted/50">
                  {session.customerName && (
                    <p
                      className="text-sm font-medium"
                      data-testid="text-customer-name"
                    >
                      {session.customerName}
                    </p>
                  )}
                  {session.customerEmail && (
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid="text-customer-email"
                    >
                      {session.customerEmail}
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3">
                <Link href="/pricing">
                  <Button className="w-full" data-testid="button-back-pricing">
                    Back to Pricing
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
