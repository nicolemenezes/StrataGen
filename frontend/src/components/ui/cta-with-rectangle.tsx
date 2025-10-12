import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CTAProps {
  badge?: {
    text: string;
  };
  title: string;
  description?: string;
  action: {
    text: string;
    href: string;
    variant?: "default" | "glow";
  };
  withGlow?: boolean;
  className?: string;
}

export function CTASection({
  badge,
  title,
  description,
  action,
  withGlow = true,
  className,
}: CTAProps) {
  return (
    // prevent horizontal scrolling by clipping overflow on the section
    <section className={cn("overflow-hidden pt-0 md:pt-0", className)}>
      <div className="relative mx-auto flex w-full flex-col items-center gap-6 px-8 py-12 text-center sm:gap-8 md:py-24">
        {/* wrapper - keep full width but do not use vw which causes horizontal scroll */}
        <div className="relative w-full">
          {/* Glow behind everything (large, soft, curved) */}
          {withGlow && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-44 -mb-6 rounded-b-[5rem] blur-3xl opacity-95"
              style={{
                height: "300px",
                borderRadius: "4rem",
                filter: "blur(56px)",
                opacity: 0.95,
                background:
                  "radial-gradient(1200px 240px at 50% 70%, rgba(250,180,120,0.28) 0%, rgba(250,180,120,0.12) 18%, rgba(250,180,120,0.04) 38%, transparent 60%)",
              }}
            />
          )}

          {/* outer border with stronger curve (no top border) */}
          <div
            aria-hidden
            className="absolute inset-x-0 z-10 top-2"
            style={{
              borderRadius: "3.5rem",
              borderTopWidth: 0, // remove top border
              borderLeft: "1px solid rgba(0,0,0,0.06)",
              borderRight: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 2px 0 rgba(255,255,255,0.6) inset",
            }}
          />

          {/* extended bottom border (wider than main border) */}
          <div
            aria-hidden
            className="absolute inset-x-0 z-15"
            style={{
              bottom: "-12px",
              height: 0,
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              borderBottomLeftRadius: "4rem",
              borderBottomRightRadius: "4rem",
            }}
          />

          {/* actual card (content) - centered and wider */}
          <div className="relative w-full max-w-[1200px] mx-auto overflow-hidden z-20">
            <div className="px-8 py-12 sm:py-16 flex flex-col items-center gap-6">
              {/* Title */}
              <h2 className="text-3xl font-semibold sm:text-5xl text-black">
                {title}
              </h2>

              {/* Description */}
              {description && (
                <p className="text-black max-w-[70ch]">
                  {description}
                </p>
              )}

              {/* Action Button */}
              <Button
                variant={action.variant === "glow" ? "default" : action.variant || "default"}
                size="lg"
                className="bg-black text-white px-8 py-3 rounded-md shadow-md"
                asChild
              >
                <a href={action.href}>{action.text}</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}