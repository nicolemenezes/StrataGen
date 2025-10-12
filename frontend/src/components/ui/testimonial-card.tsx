import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export interface TestimonialAuthor {
  name: string;
  handle: string;
  avatar: string;
}

export interface TestimonialCardProps {
  author: TestimonialAuthor;
  text: string;
  href?: string;
  className?: string;
}

export function TestimonialCard({ author, text, href, className }: TestimonialCardProps) {
  const Card: any = href ? "a" : "div";

  return (
    <Card
      {...(href ? { href } : {})}
      className={cn(
        // reduced min-height slightly so cards are a bit shorter
        "flex flex-col rounded-lg border bg-gradient-to-b from-muted/50 to-muted/10",
        "p-4 text-start sm:p-6",
        "hover:from-muted/60 hover:to-muted/20",
        "max-w-[320px] sm:max-w-[320px]",
        "transition-colors duration-300",
        // sizing & layout adjustments (reduced a little)
        "min-h-[220px] sm:min-h-[240px] w-[320px] flex-none",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={author.avatar} alt={author.name} />
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-md font-semibold leading-none">{author.name}</h3>
          <p className="text-sm text-muted-foreground">{author.handle}</p>
        </div>
      </div>

      {/* ensure text always wraps and is visible */}
      <p className="sm:text-md mt-4 text-sm text-muted-foreground whitespace-normal break-words">
        {text}
      </p>
    </Card>
  );
}