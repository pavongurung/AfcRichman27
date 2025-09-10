import { Button } from "./ui/button";
import heroImage from "../../../attached_assets/image_1757374036583.png";

export default function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Large banner background showcasing football action */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-top bg-no-repeat" 
        style={{
          backgroundImage: `url('${heroImage}')`,
          imageRendering: 'crisp-edges'
        }}
      ></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Welcome to<br />
            <span className="text-primary">AFC Richman</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="hero-description">
            We're home to skilled, committed players who give 100% every match — combining serious competition with good vibes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="border-border text-foreground hover:bg-muted px-8 py-3 font-semibold" 
              data-testid="hero-watch-button"
              onClick={() => window.open('https://www.twitch.tv/sevlakev', '_blank')}
            >
              Watch Live
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
