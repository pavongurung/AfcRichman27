import { Link } from "wouter";
import { Button } from "./ui/button";
import { Menu, Settings, X } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useState } from "react";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-4" data-testid="logo-link">
            <img
              src="../../../attached_assets/richmanlogo_1757482397915.png"
              alt="AFC Richman Logo"
              className="w-10 h-10 object-contain"
              data-testid="logo-icon"
            />
            <div className="text-xl font-bold">AFC Richman</div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105" data-testid="nav-home">
              Home
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></div>
            </Link>
            <Link href="/squad" className="group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105" data-testid="nav-team">
              Team
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></div>
            </Link>
            <Link href="/statistics" className="group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105" data-testid="nav-statistics">
              Statistics
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></div>
            </Link>
            <Link href="/matches" className="group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105" data-testid="nav-matches">
              Match Center
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></div>
            </Link>
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/admin" data-testid="admin-link">
                  <Button variant="outline" size="sm" className="hidden md:flex">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={async () => {
                    await fetch('/api/admin/logout', { method: 'POST' });
                    window.location.href = '/';
                  }}
                  className="hidden md:flex"
                  data-testid="logout-button"
                >
                  Logout
                </Button>
              </>
            ) : null}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              data-testid="mobile-menu-button"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <nav className="container mx-auto px-4 py-4 space-y-4">
              <Link 
                href="/" 
                className="block group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105 py-2" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-home"
              >
                Home
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></div>
              </Link>
              <Link 
                href="/squad" 
                className="block group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105 py-2" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-team"
              >
                Team
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></div>
              </Link>
              <Link 
                href="/statistics" 
                className="block group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105 py-2" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-statistics"
              >
                Statistics
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></div>
              </Link>
              <Link 
                href="/matches" 
                className="block group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-110 py-2" 
                onClick={() => setIsMobileMenuOpen(false)}
                data-testid="mobile-nav-matches"
              >
                Match Center
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></div>
              </Link>
              {isAuthenticated && (
                <Link 
                  href="/admin" 
                  className="block group relative text-foreground hover:text-primary transition-all duration-300 transform hover:scale-105 py-2" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  data-testid="mobile-nav-admin"
                >
                  <div className="flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Admin
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 origin-center transition-transform duration-300 group-hover:scale-x-100"></div>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
