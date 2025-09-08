import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4" data-testid="logo-link">
            <img
              src="/richmanlogo.png"
              alt="AFC Richman Logo"
              className="w-10 h-10 object-contain"
              data-testid="logo-icon"
            />
            <div className="text-xl font-bold">AFC Richman</div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-primary transition-colors" data-testid="nav-latest">
              Latest
            </Link>
            <Link href="/squad" className="text-foreground hover:text-primary transition-colors" data-testid="nav-team">
              Team
            </Link>
            <Link href="/statistics" className="text-foreground hover:text-primary transition-colors" data-testid="nav-statistics">
              Statistics
            </Link>
            <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-matches">
              Matches
            </a>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
