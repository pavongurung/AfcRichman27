import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Calendar, MapPin, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Match, Player } from "@shared/schema";
import { format } from "date-fns";
import LineupView from "@/components/LineupView";

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id;

  const { data: match, isLoading: matchLoading } = useQuery<Match>({
    queryKey: ["/api/matches", matchId],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}`);
      if (!response.ok) throw new Error("Failed to fetch match");
      return response.json();
    },
    enabled: !!matchId,
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: async () => {
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
  });

  if (matchLoading || !match) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading match details...</div>
      </div>
    );
  }

  const isRichmanMatch = match.homeTeam.toLowerCase().includes("richman");
  const hasLineup = match.formation && match.lineup && Object.keys(match.lineup).length > 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FT":
        return "bg-green-500";
      case "Live":
        return "bg-red-500";
      case "Upcoming":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "FT":
        return "Full Time";
      case "Live":
        return "Live";
      case "Upcoming":
        return "Upcoming";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`${getStatusColor(match.status)} text-white border-0`}>
                {getStatusText(match.status)}
              </Badge>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{match.competition}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Match Header */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Competition & Date */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 text-gray-400 mb-2">
              <Trophy className="w-4 h-4" />
              <span className="text-sm font-medium">{match.competition}</span>
              <span>•</span>
              <Calendar className="w-4 h-4" />
              <span className="text-sm">
                {format(new Date(match.matchDate), "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
            </div>
          </div>

          {/* Teams & Score */}
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Home Team */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                {match.homeTeamLogo ? (
                  <img 
                    src={match.homeTeamLogo} 
                    alt={match.homeTeam}
                    className="w-12 h-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-400">
                    {match.homeTeam.charAt(0)}
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {match.homeTeam}
              </h1>
            </div>

            {/* Score */}
            <div className="text-center">
              {match.status === "FT" ? (
                <div className="text-5xl md:text-6xl font-bold text-white">
                  {match.homeScore} - {match.awayScore}
                </div>
              ) : match.status === "Live" ? (
                <div className="text-3xl font-bold text-red-500 animate-pulse">
                  LIVE
                </div>
              ) : (
                <div className="text-2xl font-medium text-gray-400">
                  VS
                </div>
              )}
            </div>

            {/* Away Team */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                {match.awayTeamLogo ? (
                  <img 
                    src={match.awayTeamLogo} 
                    alt={match.awayTeam}
                    className="w-12 h-12 object-cover rounded-full"
                  />
                ) : (
                  <div className="text-2xl font-bold text-gray-400">
                    {match.awayTeam.charAt(0)}
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {match.awayTeam}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Lineup Section */}
      {(isRichmanMatch && hasLineup) ? (
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-white mb-4">LINEUP</h2>
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Users className="w-5 h-5" />
                <span>Formation: {match.formation}</span>
              </div>
            </div>
            
            <LineupView
              formation={match.formation || "4-3-3"}
              lineup={match.lineup ? match.lineup as Record<string, string> : {}}
              players={players}
              className="max-w-lg mx-auto"
              size="large"
            />
          </div>
        </div>
      ) : null}

      {/* No Lineup Message */}
      {(!isRichmanMatch || !hasLineup) ? (
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="text-gray-500">
              {!isRichmanMatch 
                ? "Lineup data is only available for AFC Richman matches"
                : "No lineup data available for this match"
              }
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}