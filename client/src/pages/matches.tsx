import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Play, Trophy, Users, ChevronDown, ChevronUp } from "lucide-react";
import type { Match, Player } from "@shared/schema";
import { format } from "date-fns";
import LineupView from "@/components/LineupView";

type FilterType = "all" | "upcoming" | "finished";

export default function MatchesPage() {
  const [filter, setFilter] = useState<FilterType>("all");
  
  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const filteredMatches = matches.filter((match) => {
    if (filter === "all") return true;
    if (filter === "upcoming") return match.status === "Upcoming" || match.status === "Live";
    if (filter === "finished") return match.status === "FT";
    return true;
  });

  // Group matches by month for calendar view
  const matchesByMonth = filteredMatches.reduce((acc, match) => {
    const monthKey = format(new Date(match.matchDate), "MMMM yyyy");
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white">Loading matches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-gray-800 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-semibold text-white mb-6">Matches</h1>
          
          {/* Filter Buttons */}
          <div className="flex gap-1 bg-gray-900 p-1 rounded-lg w-fit">
            {[
              { key: "all", label: "All" },
              { key: "upcoming", label: "Upcoming" },
              { key: "finished", label: "Results" }
            ].map(({ key, label }) => (
              <Button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                variant="ghost"
                size="sm"
                className={`${
                  filter === key 
                    ? "bg-white text-black hover:bg-gray-100" 
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                } transition-colors`}
                data-testid={`filter-${key}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {filteredMatches.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No matches found</h3>
              <p className="text-muted-foreground">
                {filter === "all" ? "No matches scheduled yet." :
                 filter === "upcoming" ? "No upcoming matches at the moment." :
                 "No finished matches to display."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(matchesByMonth)
              .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
              .map(([month, monthMatches]) => (
              <div key={month}>
                <h2 className="text-lg font-medium text-gray-400 mb-4 border-b border-gray-800 pb-2">
                  {month}
                </h2>
                
                <div className="grid gap-4">
                  {monthMatches
                    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())
                    .map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const matchDate = new Date(match.matchDate);
  const isUpcoming = match.status === "Upcoming";
  const isLive = match.status === "Live";
  const isFinished = match.status === "FT";
  
  // Get players data for lineup display
  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
  });
  
  // Check if this match involves AFC Richman and has lineup data
  const isRichmanMatch = match.homeTeam === "AFC Richman" || match.awayTeam === "AFC Richman";
  const hasLineup = match.formation && match.lineup && typeof match.lineup === 'object' && Object.keys(match.lineup).length > 0;
  
  return (
    <Card className="border-gray-800 bg-gray-900/50 hover:bg-gray-900/70 transition-colors" data-testid={`match-card-${match.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Date and Competition */}
          <div className="text-sm text-gray-400 mb-3">
            {format(matchDate, "MMM d, h:mm a")} • {match.competition}
            {isLive && <span className="ml-2 text-red-500 font-medium">LIVE</span>}
          </div>
        </div>

        {/* Teams and Score */}
        <div className="flex items-center justify-between">
          {/* Home Team */}
          <div className="flex items-center gap-3 flex-1">
            <div className="font-medium text-white">{match.homeTeam}</div>
          </div>

          {/* Score or VS */}
          <div className="text-center px-4">
            {isFinished && match.homeScore !== undefined && match.awayScore !== undefined ? (
              <div className="text-xl font-semibold text-white">
                {match.homeScore} - {match.awayScore}
              </div>
            ) : (
              <div className="text-sm font-medium text-gray-400">
                {format(matchDate, "h:mm a")}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="font-medium text-white">{match.awayTeam}</div>
          </div>
        </div>

        
        {/* Actions - Only show for AFC Richman matches */}
        {isRichmanMatch && (
          <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a 
                href="https://www.twitch.tv/sevlakev/videos" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                data-testid={`watch-button-${match.id}`}
              >
                <Play className="w-3 h-3" />
                {isFinished ? "Watch Highlights" : "Watch Live"}
              </a>
              
              {/* View Lineup link for matches with lineup data */}
              {hasLineup && (
                <a 
                  href={`/matches/${match.id}`}
                  className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-1"
                  data-testid={`lineup-link-${match.id}`}
                >
                  <Users className="w-3 h-3" />
                  View Lineup
                </a>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}

function MatchCountdown({ matchDate }: { matchDate: Date }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const matchTime = matchDate.getTime();
      const difference = matchTime - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft("Match started!");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [matchDate]);

  return (
    <div className="text-center">
      <div className="text-sm text-muted-foreground mb-1">Time until kickoff</div>
      <div className="text-xl font-bold text-red-500" data-testid="countdown-timer">
        {timeLeft}
      </div>
    </div>
  );
}