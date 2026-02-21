import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { XCircle, ArrowLeft } from "lucide-react";

export default function Cancel() {
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
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-muted-foreground" />
              </div>

              <h1
                className="text-2xl sm:text-3xl font-bold"
                data-testid="text-cancel-heading"
              >
                Checkout Cancelled
              </h1>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                No worries — you haven't been charged. You can come back
                anytime to pick the plan that's right for you.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                <Link href="/pricing">
                  <Button className="w-full" data-testid="button-back-to-pricing">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Back to Pricing
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
