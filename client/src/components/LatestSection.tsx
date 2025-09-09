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
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-700">
                    {match.homeTeamLogo ? (
                      <img 
                        src={match.homeTeamLogo} 
                        alt={match.homeTeam} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {match.homeTeam.substring(0, 3)}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold">{match.homeTeam}</span>
                </div>
                
                <div className="text-center px-4">
                  {match.status === "FT" ? (
                    <div className="text-lg font-bold">{match.homeScore} - {match.awayScore}</div>
                  ) : (
                    <div className="text-lg font-bold">VS</div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="font-semibold">{match.awayTeam}</span>
                  <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center overflow-hidden border border-gray-700">
                    {match.awayTeamLogo ? (
                      <img 
                        src={match.awayTeamLogo} 
                        alt={match.awayTeam} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-white font-bold text-xs">
                        {match.awayTeam.substring(0, 3)}
                      </span>
                    )}
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
                    className="w-full border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                    onClick={() => match.replayUrl && window.open(match.replayUrl, '_blank')}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Watch Replay
                  </Button>
                )}
                {match.status === "Live" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-red-600 hover:bg-red-700 text-white border-0"
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
