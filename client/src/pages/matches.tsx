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
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-700 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-white mb-4">Match Calendar</h1>
          <p className="text-xl text-red-100 mb-8">
            Complete fixture list and results for AFC Richman
          </p>
          
          {/* Filter Buttons */}
          <div className="flex justify-center gap-4">
            {[
              { key: "all", label: "All Matches", count: matches.length },
              { key: "upcoming", label: "Upcoming", count: matches.filter(m => m.status === "Upcoming" || m.status === "Live").length },
              { key: "finished", label: "Results", count: matches.filter(m => m.status === "FT").length }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                onClick={() => setFilter(key as FilterType)}
                variant={filter === key ? "default" : "outline"}
                className={`${
                  filter === key 
                    ? "bg-white text-red-900 hover:bg-gray-100" 
                    : "border-white text-white hover:bg-white/10"
                }`}
                data-testid={`filter-${key}`}
              >
                {label} ({count})
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
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
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Trophy className="w-6 h-6 mr-2 text-red-500" />
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
    <Card className="hover:shadow-lg transition-shadow" data-testid={`match-card-${match.id}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Match Info */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              {/* Competition and Date */}
              <div className="flex items-center gap-4">
                <Badge 
                  variant={isFinished ? "default" : isLive ? "destructive" : "secondary"}
                  className="text-sm px-3 py-1"
                >
                  {match.competition}
                </Badge>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(matchDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{format(matchDate, "h:mm a")}</span>
                </div>
              </div>
              
              <Badge variant={
                isFinished ? "default" : 
                isLive ? "destructive" : 
                "secondary"
              }>
                {match.status === "FT" ? "Full Time" : match.status}
              </Badge>
            </div>

            {/* Teams and Score */}
            <div className="flex items-center justify-between gap-6">
              {/* Home Team */}
              <div className="flex items-center gap-3 flex-1">
                {match.homeTeamLogo && (
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img 
                      src={match.homeTeamLogo} 
                      alt={match.homeTeam} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-lg">{match.homeTeam}</div>
                  {match.homeTeam === "AFC Richman" && (
                    <div className="text-xs text-red-500 font-medium">HOME</div>
                  )}
                </div>
              </div>

              {/* Score or VS */}
              <div className="text-center px-6">
                {isFinished && match.homeScore !== undefined && match.awayScore !== undefined ? (
                  <div className="text-2xl font-bold">
                    {match.homeScore} - {match.awayScore}
                  </div>
                ) : isLive ? (
                  <div className="text-xl font-bold text-red-500 animate-pulse">
                    LIVE
                  </div>
                ) : (
                  <div className="text-xl font-bold text-muted-foreground">
                    VS
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-3 flex-1 justify-end">
                <div className="flex-1 text-right">
                  <div className="font-semibold text-lg">{match.awayTeam}</div>
                  {match.awayTeam === "AFC Richman" && (
                    <div className="text-xs text-red-500 font-medium">AWAY</div>
                  )}
                </div>
                {match.awayTeamLogo && (
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <img 
                      src={match.awayTeamLogo} 
                      alt={match.awayTeam} 
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="ml-6 flex items-center gap-2">
            {match.replayUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2"
                data-testid={`watch-button-${match.id}`}
              >
                <a href={match.replayUrl} target="_blank" rel="noopener noreferrer">
                  <Play className="w-4 h-4" />
                  {isFinished ? "Watch Highlights" : "Watch Live"}
                </a>
              </Button>
            )}
            
            {/* View Lineup Button - Show for finished AFC Richman matches with lineup */}
            {(isFinished && isRichmanMatch && hasLineup) ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2"
                data-testid={`lineup-button-${match.id}`}
              >
                <Users className="w-4 h-4" />
                View Lineup
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Countdown for upcoming matches */}
        {isUpcoming ? (
          <div className="mt-4 pt-4 border-t">
            <MatchCountdown matchDate={matchDate} />
          </div>
        ) : null}

        {/* Expanded Lineup Section */}
        {(isExpanded && isFinished && isRichmanMatch && hasLineup) ? (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-center">
              <LineupView
                formation={match.formation || undefined}
                lineup={match.lineup as Record<string, string> | undefined}
                players={players}
                size="small"
                className="max-w-md"
              />
            </div>
          </div>
        ) : null}
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