import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Footer({ className }: { className?: string }) {
  const links = {
    product: [
      { label: "Features", href: "#" },
      { label: "Pricing", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
    company: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
    resources: [
      { label: "Docs", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Support", href: "#" },
    ],
  };

  return (
    <footer
      className={cn(
        "bg-white text-muted-foreground border-t border-border pt-10 pb-8",
        className
      )}
      aria-labelledby="footer-heading"
    >
      <div className="mx-auto max-w-container px-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex-1">
            <a href="/" className="inline-block text-2xl font-bold text-foreground">
              Launch UI
            </a>
            <p className="mt-3 max-w-md text-sm text-muted-foreground">
              Build faster with prebuilt UI primitives and beautiful layouts.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted/10 hover:bg-muted/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M23 4.5a9.1 9.1 0 0 1-2.6.7A4.5 4.5 0 0 0 22.3 3a9 9 0 0 1-2.9 1.1A4.5 4.5 0 0 0 12 7.5v.6A12.8 12.8 0 0 1 3 3.6a4.5 4.5 0 0 0 1.4 6A4.3 4.3 0 0 1 2.8 9v.1a4.5 4.5 0 0 0 3.6 4.4c-.9.2-1.8.3-2.7.1A4.5 4.5 0 0 0 7.5 19c-2.8 1.8-6.4 2.2-9.7 1.1A12.7 12.7 0 0 0 8.7 22c7.9 0 12.2-6.5 12.2-12.1v-.6A8.7 8.7 0 0 0 23 4.5z" fill="currentColor"/>
                </svg>
              </a>

              <a
                href="#"
                aria-label="GitHub"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted/10 hover:bg-muted/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.5v-2c-3.3.7-4-1.6-4-1.6-.5-1.3-1.2-1.7-1.2-1.7-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.8-.7 2.2-1.1-.8-.1-1.8-.4-2.4-.8-.2-.7-.9-1.2-1.6-1.2-1.1 0-2 .9-2 2 .2 1 .9 1.6 1.8 1.8.2.6.7 1 1.4 1.3A12 12 0 0 0 12 .5z" fill="currentColor"/>
                </svg>
              </a>

              <a
                href="#"
                aria-label="LinkedIn"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-muted/10 hover:bg-muted/20"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M4.98 3.5C4.98 4.88 3.9 6 2.5 6S0 4.88 0 3.5 1.08 1 2.5 1 4.98 2.12 4.98 3.5zM.5 8h4V24H.5zM8 8h3.8v2.2h.1c.5-.9 1.7-1.8 3.6-1.8 3.9 0 4.6 2.6 4.6 6V24h-4v-7.2c0-1.7-.1-3.8-2.4-3.8-2.4 0-2.8 1.9-2.8 3.7V24H8V8z" fill="currentColor"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 flex-1">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm">
                {links.product.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Company</h4>
              <ul className="space-y-2 text-sm">
                {links.company.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm">
                {links.resources.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="text-muted-foreground hover:text-foreground">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Launch UI. All rights reserved.
          </p>

          <form className="flex items-center gap-2">
            <input
              aria-label="Email"
              type="email"
              placeholder="Your email"
              className="rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <Button size="sm" variant="default">
              Subscribe
            </Button>
          </form>
        </div>
      </div>
    </footer>
  );
}