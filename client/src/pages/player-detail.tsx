import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { Button } from "../components/ui/button";
import type { Player, PlayerStats } from "@shared/schema";

export default function PlayerDetail() {
  const [, params] = useRoute("/player/:id");
  const playerId = params?.id;

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error("Failed to fetch player");
      return response.json();
    },
    enabled: !!playerId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch player stats");
      return response.json();
    },
    enabled: !!playerId,
  });

  if (playerLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        Loading...
      </div>
    );
  }

  if (!player || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        Player not found
      </div>
    );
  }

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  // Calculate completion percentage for stats
  const getCompletionPercentage = (value: number, max: number = 100) => {
    return Math.min((value / max) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="bg-black/80 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-6">
              <Link href="/">
                <div className="flex items-center space-x-2">
                  <img src="../../../attached_assets/richmanlogo_1757482397915.png" alt="AFC Richman" className="w-8 h-8 object-contain" />
                  <span className="text-white font-bold">AFC Richman</span>
                </div>
              </Link>
              <nav className="flex space-x-8 text-sm">
                <Link href="/" className="text-muted-foreground hover:text-white transition-colors">Latest</Link>
                <Link href="/squad" className="text-muted-foreground hover:text-white transition-colors">Team</Link>
                <Link href="/statistics" className="text-muted-foreground hover:text-white transition-colors">Statistics</Link>
                <span className="text-muted-foreground">Matches</span>
              </nav>
            </div>
            <Link href="/squad">
              <Button variant="ghost" size="sm" className="text-white">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Squad
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-96 overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-contain bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('${player.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"}')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>

        {/* Player Info */}
        <div className="relative z-10 container mx-auto px-4 h-full flex items-end pb-8">
          <div className="flex items-center space-x-6">
            {/* Jersey Number Badge */}
            <div className="bg-red-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold">
              {player.jerseyNumber}
            </div>
            
            <div>
              <div className="text-red-500 uppercase text-sm font-semibold mb-1">{player.position}</div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                {player.jerseyNumber} / {player.firstName.toUpperCase()} {player.lastName.toUpperCase()}
              </h1>
              
              {/* Player Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Nationality:</div>
                  <div className="text-white font-medium">{player.nationality}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Date of birth:</div>
                  <div className="text-white font-medium">{player.dateOfBirth ? formatDate(player.dateOfBirth) : 'N/A'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Height:</div>
                  <div className="text-white font-medium">{player.height}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">At AFC Richman since:</div>
                  <div className="text-white font-medium">{formatDate(player.joinDate)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Statistics</h2>
          
          {/* Circular Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Games Played */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-red-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${getCompletionPercentage(stats.gamesPlayed || 0, 30)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{stats.gamesPlayed || 0}</span>
                </div>
              </div>
              <div className="text-white font-medium">Games played</div>
            </div>

            {/* Goals */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-green-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${getCompletionPercentage(stats.goals || 0, 25)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{stats.goals || 0}</span>
                </div>
              </div>
              <div className="text-white font-medium">Goals</div>
            </div>

            {/* Assists */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${getCompletionPercentage(stats.assists || 0, 15)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{stats.assists || 0}</span>
                </div>
              </div>
              <div className="text-white font-medium">Assists</div>
            </div>

            {/* Cards */}
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-700"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-yellow-500"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={`${getCompletionPercentage((stats.yellowCards || 0) + (stats.redCards || 0), 10)}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{(stats.yellowCards || 0) + (stats.redCards || 0)}</span>
                </div>
              </div>
              <div className="text-white font-medium">Cards</div>
            </div>
          </div>

          {/* Detailed Stats Grid - FC 25 Pro Clubs Style */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Basic Stats */}
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-l-4 border-red-500 pl-3">Basic</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Appearance</span>
                  <span className="text-white font-medium">{stats.appearance || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">MOTM</span>
                  <span className="text-white font-medium">{stats.motm || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Goals</span>
                  <span className="text-white font-medium">{stats.goals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assists</span>
                  <span className="text-white font-medium">{stats.assists || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Rating</span>
                  <span className="text-white font-medium">{stats.avgRating ? ((stats.avgRating || 0) / 10).toFixed(1) : "0.0"}</span>
                </div>
              </div>
            </div>

            {/* Possession & Defensive */}
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-l-4 border-blue-500 pl-3">Possession & Defense</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Possession Won</span>
                  <span className="text-white font-medium">{stats.possessionWon || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Possession Lost</span>
                  <span className="text-white font-medium">{stats.possessionLost || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Possession Difference</span>
                  <span className="text-white font-medium">{stats.possessionDifference || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clean Sheet</span>
                  <span className="text-white font-medium">{stats.cleanSheet || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tackles</span>
                  <span className="text-white font-medium">{stats.tackles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tackle Success Rate (%)</span>
                  <span className="text-white font-medium">{stats.tackleSuccessRate || 0}%</span>
                </div>
              </div>
            </div>

            {/* Attacking & Skills */}
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-l-4 border-green-500 pl-3">Attacking & Skills</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shots</span>
                  <span className="text-white font-medium">{stats.shots || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shot Accuracy (%)</span>
                  <span className="text-white font-medium">{stats.shotAccuracy || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passes</span>
                  <span className="text-white font-medium">{stats.passes || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pass Accuracy (%)</span>
                  <span className="text-white font-medium">{stats.passAccuracy || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dribbles</span>
                  <span className="text-white font-medium">{stats.dribbles || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dribble Success Rate (%)</span>
                  <span className="text-white font-medium">{stats.dribbleSuccessRate || 0}%</span>
                </div>
              </div>
            </div>

            {/* Goalkeeping & Discipline */}
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-l-4 border-purple-500 pl-3">Goalkeeping & Discipline</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Saves</span>
                  <span className="text-white font-medium">{stats.saves || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PK Save</span>
                  <span className="text-white font-medium">{stats.pkSave || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yellow</span>
                  <span className="text-white font-medium">{stats.yellowCards || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Red</span>
                  <span className="text-white font-medium">{stats.redCards || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Offsides</span>
                  <span className="text-white font-medium">{stats.offsides || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fouls Committed</span>
                  <span className="text-white font-medium">{stats.foulsCommitted || 0}</span>
                </div>
              </div>
            </div>

            {/* Physical Performance */}
            <div className="bg-secondary p-6 rounded-lg">
              <h3 className="text-white font-semibold mb-4 border-l-4 border-orange-500 pl-3">Physical Performance</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Minutes Played</span>
                  <span className="text-white font-medium">{stats.minutesPlayed || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance Covered (km)</span>
                  <span className="text-white font-medium">
                    {stats.distanceCovered ? (stats.distanceCovered / 1000).toFixed(1) : "0.0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Distance Sprinted (km)</span>
                  <span className="text-white font-medium">
                    {stats.distanceSprinted ? (stats.distanceSprinted / 1000).toFixed(1) : "0.0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}