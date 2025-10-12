import React from "react";
import { FeaturesSectionWithHoverEffects } from "@/components/ui/feature-section-with-hover-effects";

function FeaturesSectionWithHoverEffectsDemo() {
  return (
    // Use normal flow and spacing so this appears below previous sections
    <div className="w-full py-16">
      <FeaturesSectionWithHoverEffects />
    </div>
  );
}

export { FeaturesSectionWithHoverEffectsDemo };