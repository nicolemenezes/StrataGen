import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface UINavbarProps {
  onNavigate?: (sectionId: string) => void;
  onSignIn?: () => void;
  onSignUp?: () => void;
  className?: string;
}

const UINavbar = ({ 
  onNavigate, 
  onSignIn, 
  onSignUp,
  className = "" 
}: UINavbarProps) => {
  const navItems = [
    { label: "Home", id: "home" },
    { label: "Benefits", id: "benefits" },
    { label: "About", id: "about" },
    { label: "Pricing", id: "pricing" }
  ];

  return (
    <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border ${className}`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold text-foreground">StrataGen</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate?.(item.id)}
                className="text-foreground hover:text-primary transition-colors font-medium"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={onSignIn}
              className="text-foreground hover:text-primary"
            >
              Sign In
            </Button>
            <Button 
              onClick={onSignUp}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Sign Up
            </Button>
          </div>

          {/* Mobile Menu Button (optional) */}
          <div className="md:hidden">
            <button className="text-foreground hover:text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default UINavbar;