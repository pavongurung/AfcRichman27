import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-secondary py-16 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-4 mb-6">
              <img
                src="../../../attached_assets/richmanlogo_1757482397915.png"
                alt="AFC Richman Logo"
                className="w-12 h-12 object-contain"
              />
              <div className="text-2xl font-bold">AFC Richman</div>
            </div>

            <p className="text-muted-foreground mb-4">
              Leading the charge in modern football with passion, dedication, and excellence.
            </p>

            {/* Social icons */}
            <div className="flex space-x-4">
              <a 
                href="https://discord.gg/QtbXESp3FY" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-muted-foreground hover:text-primary transition-colors" 
                data-testid="social-discord"
                title="Join our Discord server"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Other sections unchanged */}
          <div>
            <h3 className="font-semibold mb-4">Team</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/squad" className="hover:text-primary transition-colors" data-testid="footer-squad">Squad</Link></li>
              <li><Link href="/statistics" className="hover:text-primary transition-colors" data-testid="footer-statistics">Statistics</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Matches</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><Link href="/matches" className="hover:text-primary transition-colors" data-testid="footer-matches">All Matches</Link></li>
              <li><a href="https://www.twitch.tv/sevlakev" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" data-testid="footer-livestream">Live Stream</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Club</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="https://discord.gg/QtbXESp3FY" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors" data-testid="footer-contact">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8">
          <div className="text-center">
            <div className="text-muted-foreground text-sm">
              © 2024 AFC Richman. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
