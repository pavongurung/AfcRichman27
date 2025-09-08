import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Large banner background showcasing football action */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-10"></div>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80')"
        }}
      ></div>
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Welcome to<br />
            <span className="text-primary">AFC Richman</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="hero-description">
            Experience the passion, power, and pride of our football club. Follow our journey to greatness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 font-semibold" 
              data-testid="hero-news-button"
            >
              Latest News
            </Button>
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
