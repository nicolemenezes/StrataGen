import React from "react";
import { CTASection } from "@/components/ui/cta-with-rectangle";

export function CTADemo() {
  return (
    <CTASection
      badge={{
        text: "Get started",
      }}
      title="Start building with Stratagen"
      description="Get started with Stratagen and build your campaign plan in no time"
      action={{
        text: "Get Started",
        href: "/docs",
        variant: "default",
      }}
    />
  );
}