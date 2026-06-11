import React from "react";
import { Hero } from "@/components/ui/animated-hero";

function HeroDemo(): React.JSX.Element {
  return (
    <section id="hero" className="w-full">
      <div className="block">
        <Hero />
      </div>
    </section>
  );
}

export { HeroDemo };