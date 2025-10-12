import React, { useRef, useState, useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

/**
 * Small local useMediaQuery hook so component works without extra imports.
 */
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [query]);

  return matches;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = `Choose the plan that works for you
All plans include access to our platform, lead generation tools, and dedicated support.`,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement | null>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: x / window.innerWidth, y: y / window.innerHeight },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // extra items to ensure more checkboxes across all cards
  const extraChecks = [
    "Priority support",
    "Custom reports",
    "Team seats",
    "Advanced integrations",
    "SLA",
    "Audit logs",
  ];

  return (
    <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">{description}</p>
      </div>

      {/* shifted the cards down a bit with mt-8 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 relative justify-items-center mt-35">
        {plans.map((plan, index) => {
          const displayValue = isMonthly ? Number(plan.price) : Number(plan.yearlyPrice);
          const formatted = currencyFormatter.format(displayValue);

          const isMiddle = index === 1;

          // narrower width for side cards, slightly wider middle; all cards white background
          const maxWidth = isMiddle ? "max-w-[26rem]" : "max-w-[20rem]";
          // reduced height slightly from previous value
          const cardBaseClasses = cn(
            `rounded-2xl border-[1px] p-8 bg-white text-center lg:flex lg:flex-col lg:justify-center relative min-h-[44rem] w-full ${maxWidth} mx-auto overflow-visible`,
            plan.isPopular ? "border-primary border-2" : "border-border",
            "flex flex-col"
          );

          // middle card sits above neighbors, centered and overlapping them
          const cardTransformClasses = isMiddle
            ? "z-50 -translate-y-12 scale-105 shadow-2xl -mx-4"
            : "z-10";

          // Button styles
          const popularButtonClasses = "bg-black text-white py-3 rounded-md";
          const otherButtonBase = cn(
            buttonVariants({ variant: "outline" }),
            "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter py-3 rounded-md transition-colors duration-200"
          );
          const otherButtonHover = "hover:bg-black hover:text-white";

          // ensure we display more checkboxes: merge plan.features with extraChecks and limit to 10
          const featuresToShow = plan.features.concat(extraChecks).slice(0, 10);

          return (
            <motion.div
              key={index}
              initial={{ y: 50, opacity: 1 }}
              whileInView={
                isDesktop
                  ? {
                      y: plan.isPopular ? -20 : 0,
                      opacity: 1,
                      x: index === 2 ? -10 : index === 0 ? 10 : 0,
                      scale: isMiddle ? 1.03 : 1.0,
                    }
                  : {}
              }
              viewport={{ once: true }}
              transition={{
                duration: 0.9,
                type: "spring",
                stiffness: 90,
                damping: 22,
                delay: 0.2 + index * 0.05,
              }}
              className={cn(cardBaseClasses, cardTransformClasses, index === 0 && "origin-right", index === 2 && "origin-left")}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                  <Star className="text-primary-foreground h-4 w-4 fill-current" />
                  <span className="text-primary-foreground ml-1 font-sans font-semibold">Popular</span>
                </div>
              )}

              <div className="flex-1 flex flex-col">
                <p className="text-base font-semibold text-muted-foreground">{plan.name}</p>

                <div className="mt-6 flex items-center justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-foreground">{formatted}</span>

                  {plan.period !== "Next 3 months" && (
                    <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                      / {plan.period}
                    </span>
                  )}
                </div>

                <p className="text-xs leading-5 text-muted-foreground">{isMonthly ? "billed monthly" : "billed annually"}</p>

                <ul className="mt-5 gap-2 flex flex-col text-left">
                  {featuresToShow.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-left">{feature}</span>
                    </li>
                  ))}
                </ul>

                <hr className="w-full my-4" />

                {/* Buttons: middle always black; others outline -> black on hover */}
                {plan.isPopular ? (
                  <a href={plan.href} className={cn(popularButtonClasses)}>
                    {plan.buttonText}
                  </a>
                ) : (
                  <a href={plan.href} className={cn(otherButtonBase, "bg-background text-foreground", otherButtonHover)}>
                    {plan.buttonText}
                  </a>
                )}

                <p className="mt-6 text-xs leading-5 text-muted-foreground">{plan.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
