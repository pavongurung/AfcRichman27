import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">R</span>
              </div>
              <div className="text-2xl font-bold">AFC Richman</div>
            </div>
            <p className="text-muted-foreground mb-4">
              Leading the charge in modern football with passion, dedication, and excellence.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-twitter">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-instagram">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-facebook">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="social-youtube">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Team</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/squad" className="hover:text-primary transition-colors" data-testid="footer-squad">Squad</Link></li>
              <li><Link href="/statistics" className="hover:text-primary transition-colors" data-testid="footer-statistics">Statistics</Link></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-coaching">Coaching Staff</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-academy">Academy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Matches</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-fixtures">Fixtures</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-results">Results</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-season">Season</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-livestream">Live Stream</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Club</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-about">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-history">History</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-store">Store</a></li>
              <li><a href="#" className="hover:text-primary transition-colors" data-testid="footer-contact">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">
              © 2024 AFC Richman. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors" data-testid="footer-privacy">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="footer-terms">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors" data-testid="footer-cookies">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
