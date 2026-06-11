// filepath: c:\Users\Alston Dsouza\Documents\Recursion_Final-Round_13\frontend\src\components\blocks\feature-demo.tsx
import React from "react";
import { Feature } from "@/components/ui/feature";

function FeatureDemo(): React.JSX.Element {
  return (
    <section id="how-it-works" className="w-full">
      <div className="block mx-4 md:mx-12 lg:mx-32">
        <Feature />
      </div>
    </section>
  );
}

export { FeatureDemo };