import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import type { Match } from "@shared/schema";

export default function LatestSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: matches, isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    queryFn: async () => {
      const response = await fetch("/api/matches?limit=5");
      if (!response.ok) throw new Error("Failed to fetch matches");
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) + " - " + date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FT":
        return "bg-green-500";
      case "Live":
        return "bg-red-500 animate-pulse";
      case "Upcoming":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">
              <span className="text-primary italic mr-2">LATEST</span>
              <span className="text-muted-foreground">All news</span>
            </h2>
          </div>
          <div className="flex space-x-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex-none w-80 bg-card rounded-lg p-6 animate-pulse">
                <div className="h-4 bg-muted rounded mb-4"></div>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" data-testid="latest-title">
            <span className="text-white italic mr-2">LATEST</span>
            <span className="text-muted-foreground italic mr-2">/</span>
            <span className="text-muted-foreground">All news</span>
            <span className="text-red-500 ml-2">→</span>
          </h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollLeft}
              className="rounded-full"
              data-testid="scroll-left-button"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollRight}
              className="rounded-full"
              data-testid="scroll-right-button"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Horizontal scrolling fixtures */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide space-x-4 pb-4"
          data-testid="fixtures-scroll"
        >
          {matches?.map((match) => (
            <div 
              key={match.id} 
              className="flex-none w-80 bg-card rounded-lg p-6 fixture-card cursor-pointer" 
              data-testid={`fixture-card-${match.id}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(match.status)}`}></div>
                  <span className="text-sm text-muted-foreground">{match.status}</span>
                </div>
                <span className="text-sm text-muted-foreground">{match.competition}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">
                      {match.homeTeamLogo}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{match.homeTeam}</div>
                    <div className="text-sm text-muted-foreground">Home</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {match.status === "Upcoming" ? "VS" : match.homeScore}
                  </div>
                </div>
              </div>
              
              <div className="text-center text-muted-foreground my-2">-</div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {match.awayTeamLogo}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{match.awayTeam}</div>
                    <div className="text-sm text-muted-foreground">Away</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {match.status === "Upcoming" ? "VS" : match.awayScore}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground mb-3">
                  <Calendar className="inline w-4 h-4 mr-2" />
                  {formatDate(match.matchDate.toString())}
                </div>
                {match.status === "FT" && match.replayUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(match.replayUrl, '_blank')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Replay
                  </Button>
                )}
                {match.status === "Live" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={() => window.open('https://www.twitch.tv/sevlakev', '_blank')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Live
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
