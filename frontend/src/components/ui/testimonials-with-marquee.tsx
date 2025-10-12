import React, { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { TestimonialCard, TestimonialAuthor } from "@/components/ui/testimonial-card";

interface TestimonialsSectionProps {
  title: string;
  description: string;
  testimonials: Array<{
    author: TestimonialAuthor;
    text: string;
    href?: string;
  }>;
  className?: string;
}

export function TestimonialsSection({
  title,
  description,
  testimonials,
  className,
}: TestimonialsSectionProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const duration = 40; // seconds — adjust as needed
  const duplicateCount = 2; // number of times to repeat content for seamless loop

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // ensure the CSS variable is set and animation class is applied
    track.style.setProperty("--duration", `${duration}s`);
    track.style.setProperty("--gap", "1rem");
    track.classList.add("animated-marquee");
    track.style.animationPlayState = isPaused ? "paused" : "running";

    return () => {
      track.classList.remove("animated-marquee");
    };
  }, [isPaused, duration]);

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-0",
        className
      )}
    >
      {/* local keyframes + helper classes */}
      <style>{`
        .marquee-outer { overflow: hidden; }
        .marquee-track {
          display: flex;
          gap: var(--gap, 1rem);
          align-items: stretch;
          width: max-content;
        }
        .marquee-item { flex: 0 0 auto; }

        /* apply animation via class so we can toggle it on the element */
        .animated-marquee {
          animation: marquee var(--duration, 40s) linear infinite;
          will-change: transform;
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50%)); }
        }
      `}</style>

      <div className="mx-auto flex max-w-container flex-col items-center gap-4 text-center sm:gap-16">
        <div className="flex flex-col items-center gap-4 px-4 sm:gap-8">
          <h2 className="max-w-[720px] text-3xl font-semibold leading-tight sm:text-5xl sm:leading-tight">
            {title}
          </h2>
          <p className="text-md max-w-[600px] font-medium text-muted-foreground sm:text-xl">
            {description}
          </p>
        </div>

        <div className="relative flex w-full flex-col items-center justify-center marquee-outer">
          <div
            className="w-full"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div
              ref={trackRef}
              className="marquee-track"
              style={{ ["--gap" as any]: "1rem" }}
              aria-hidden={isPaused ? undefined : "true"}
            >
              {/* render duplicated sequences for seamless loop */}
              {Array.from({ length: duplicateCount }).map((_, setIndex) =>
                testimonials.map((testimonial, i) => (
                  <div key={`${setIndex}-${i}`} className="marquee-item">
                    <div className="inline-block">
                      <TestimonialCard {...testimonial} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-1/3 bg-gradient-to-r from-background sm:block" />
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-background sm:block" />
        </div>
      </div>
    </section>
  );
}