import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Calendar, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";
import { Link } from "wouter";
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
            <Link href="/matches" className="text-muted-foreground hover:text-gray-300 transition-colors cursor-pointer">All news</Link>
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
              className="flex-none w-72 bg-gray-900/30 backdrop-blur-sm rounded-2xl p-5 fixture-card cursor-pointer border border-gray-800/30 hover:border-gray-700/30 hover:bg-gray-900/40 transition-all duration-500" 
              data-testid={`fixture-card-${match.id}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(match.status)}`}></div>
                  <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{match.status}</span>
                </div>
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">{match.competition}</span>
              </div>
              
              {/* Teams - Centered Layout */}
              <div className="text-center space-y-3 mb-5">
                {/* Home Team */}
                <div className="text-center">
                  <div className="font-medium text-white text-sm">{match.homeTeam}</div>
                  {match.status === "FT" && (
                    <div className="text-2xl font-bold text-white mt-1">{match.homeScore}</div>
                  )}
                </div>

                {/* Minimal Divider */}
                <div className="flex items-center justify-center py-2">
                  {match.status === "FT" ? (
                    <div className="text-xs font-medium text-gray-600">—</div>
                  ) : (
                    <div className="text-[10px] font-medium text-gray-600 tracking-wider">VS</div>
                  )}
                </div>

                {/* Away Team */}
                <div className="text-center">
                  <div className="font-medium text-white text-sm">{match.awayTeam}</div>
                  {match.status === "FT" && (
                    <div className="text-2xl font-bold text-white mt-1">{match.awayScore}</div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="pt-3 border-t border-gray-800/20">
                <div className="text-[10px] text-gray-600 mb-3 text-center font-medium tracking-wider">
                  {formatDate(match.matchDate.toString())}
                </div>
                {match.status === "FT" && match.replayUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 bg-transparent border-gray-800/40 text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 hover:border-gray-700/40 text-xs font-medium transition-all duration-300 rounded-lg"
                    onClick={() => match.replayUrl && window.open(match.replayUrl, '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Watch Replay
                  </Button>
                )}
                {match.status === "Live" && (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-8 bg-red-600/90 hover:bg-red-600 text-white border-0 text-xs font-medium transition-all duration-300 rounded-lg"
                    onClick={() => window.open('https://www.twitch.tv/sevlakev', '_blank')}
                  >
                    <Play className="w-3 h-3 mr-1" />
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
