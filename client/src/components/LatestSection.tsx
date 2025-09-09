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
              className="flex-none w-80 bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 fixture-card cursor-pointer border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300" 
              data-testid={`fixture-card-${match.id}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(match.status)}`}></div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{match.status}</span>
                </div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{match.competition}</span>
              </div>
              
              {/* Teams */}
              <div className="space-y-4 mb-6">
                {/* Home Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700/50">
                      {match.homeTeamLogo ? (
                        <img 
                          src={match.homeTeamLogo} 
                          alt={match.homeTeam} 
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {match.homeTeam.substring(0, 3)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{match.homeTeam}</div>
                      <div className="text-xs text-gray-500">Home</div>
                    </div>
                  </div>
                  {match.status === "FT" && (
                    <div className="text-xl font-bold text-white">{match.homeScore}</div>
                  )}
                </div>

                {/* VS or Score Divider */}
                <div className="flex items-center justify-center">
                  {match.status === "FT" ? (
                    <div className="w-6 h-px bg-gray-700"></div>
                  ) : (
                    <div className="text-xs font-bold text-gray-500 bg-gray-800 px-3 py-1 rounded-full">VS</div>
                  )}
                </div>

                {/* Away Team */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden border border-gray-700/50">
                      {match.awayTeamLogo ? (
                        <img 
                          src={match.awayTeamLogo} 
                          alt={match.awayTeam} 
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">
                          {match.awayTeam.substring(0, 3)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">{match.awayTeam}</div>
                      <div className="text-xs text-gray-500">Away</div>
                    </div>
                  </div>
                  {match.status === "FT" && (
                    <div className="text-xl font-bold text-white">{match.awayScore}</div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="pt-4 border-t border-gray-800/50">
                <div className="text-xs text-gray-500 mb-3 flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(match.matchDate.toString())}
                </div>
                {match.status === "FT" && match.replayUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white hover:border-gray-600 transition-all duration-200"
                    onClick={() => match.replayUrl && window.open(match.replayUrl, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-2" />
                    Watch Replay
                  </Button>
                )}
                {match.status === "Live" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 transition-all duration-200"
                    onClick={() => window.open('https://www.twitch.tv/sevlakev', '_blank')}
                  >
                    <Play className="w-3 h-3 mr-2" />
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
