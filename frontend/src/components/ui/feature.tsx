import React from "react";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import landingImg from "/landingDashboard.png";

function Feature(): React.JSX.Element {
  return (
    <div className="w-full py-8">
      <div className="container mx-auto">
        <div className="grid border rounded-lg p-4 grid-cols-1 gap-4 items-center lg:grid-cols-2">
          {/* Left: content (reduced spacing / sizes) */}
          <div className="flex gap-6 flex-col max-w-lg">
            <div className="flex gap-4 flex-col">
              <div>
                <Badge variant="outline">Platform</Badge>
              </div>

              <div className="flex gap-2 flex-col">
                <h2 className="text-2xl lg:text-3xl tracking-tighter max-w-xl text-left font-regular">
                  Something new!
                </h2>
                <p className="text-sm leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
                  Managing a small business today is already tough.
                </p>
              </div>
            </div>

            <div className="grid lg:pl-4 grid-cols-1 sm:grid-cols-3 items-start lg:grid-cols-1 gap-3">
              <div className="flex flex-row gap-3 items-start">
                <Check className="w-3 h-3 mt-1 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Easy to use</p>
                  <p className="text-muted-foreground text-xs">
                    We&apos;ve made it easy to use and understand.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-3 items-start">
                <Check className="w-3 h-3 mt-1 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Fast and reliable</p>
                  <p className="text-muted-foreground text-xs">
                    We&apos;ve made it fast and reliable.
                  </p>
                </div>
              </div>

              <div className="flex flex-row gap-3 items-start">
                <Check className="w-3 h-3 mt-1 text-primary" />
                <div className="flex flex-col gap-1">
                  <p className="text-sm">Beautiful and modern</p>
                  <p className="text-muted-foreground text-xs">
                    We&apos;ve made it beautiful and modern.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: image - use landingDashboard asset */}
          <div className="rounded-md overflow-hidden">
            <img
              src={landingImg}
              alt="Landing dashboard"
              className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover rounded-md"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { Feature };