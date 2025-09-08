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
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center" data-testid="logo-icon">
              <span className="text-primary-foreground font-bold text-lg">R</span>
            </div>
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
            <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-news">
              News
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors" data-testid="nav-store">
              Store
            </a>
          </nav>
          
          {/* Right side */}
          <div className="flex items-center space-x-4">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90" 
              data-testid="login-button"
            >
              Login
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-button">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
