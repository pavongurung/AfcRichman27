import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Link } from "wouter";
import type { Player } from "@shared/schema";

export default function PlayersSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: async () => {
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
  });

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="text-white italic mr-2">PLAYERS</span>
              <span className="text-muted-foreground italic mr-2">/</span>
              <span className="text-muted-foreground underline decoration-red-500 decoration-2">Squad</span>
              <span className="text-red-500 ml-2">→</span>
            </h2>
          </div>
          <div className="flex space-x-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex-none w-64 bg-card rounded-lg overflow-hidden animate-pulse"
              >
                <div className="h-80 bg-muted"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        {/* Title + Scroll Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" data-testid="players-title">
            <span className="text-white italic mr-2">PLAYERS</span>
            <span className="text-muted-foreground italic mr-2">/</span>
            <span className="text-muted-foreground underline decoration-red-500 decoration-2">Squad</span>
            <span className="text-red-500 ml-2">→</span>
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollLeft}
              className="rounded-full"
              data-testid="players-scroll-left"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollRight}
              className="rounded-full"
              data-testid="players-scroll-right"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Horizontal scrolling player cards */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide space-x-6 pb-4"
          data-testid="players-scroll"
        >
          {players?.map((player) => (
            <Link
              key={player.id}
              href={`/player/${player.id}`}
              className="flex-none w-64 cursor-pointer group"
              data-testid={`player-card-${player.id}`}
            >
              <div className="flex flex-col items-center w-full">
                <div className="relative overflow-hidden rounded-md shadow-lg">
                  <div
                    className="relative h-80 w-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      backgroundImage: `url('${player.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600"}')`,
                    }}
                  >
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
                      {player.jerseyNumber}
                    </div>
                  </div>
                </div>

                <div className="text-center mt-3 w-full">
                  <p className="text-white font-semibold">
                    {player.jerseyNumber} / {player.firstName} {player.lastName}
                  </p>
                  <div className="w-full h-0.5 bg-red-500 mt-2 opacity-0 group-hover:opacity-100"></div>
                  <p className="text-muted-foreground text-sm mt-1">
                    {player.position}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
