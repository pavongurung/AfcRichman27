import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Player, PlayerStats } from "@shared/schema";

export default function PlayerDetail() {
  const [, params] = useRoute("/player/:id");
  const playerId = params?.id;

  const { data: player } = useQuery<Player>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error("Failed to fetch player");
      return response.json();
    },
    enabled: !!playerId,
  });

  const { data: stats } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch player stats");
      return response.json();
    },
    enabled: !!playerId,
  });

  if (!player || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Hero image */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{
          backgroundImage: `url('${player.imageUrl || "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&h=800"}')`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <Link href="/">
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 left-4 bg-secondary/80 hover:bg-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="absolute bottom-8 left-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
              {player.jerseyNumber}
            </div>
            <div>
              <div className="uppercase text-sm text-gray-300">{player.position}</div>
              <div className="text-4xl font-bold">
                {player.firstName.toUpperCase()} {player.lastName.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400 mt-1">At AFC Richman since: {player.joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Table */}
      <div className="p-8 overflow-x-auto">
        <h2 className="text-2xl font-bold mb-4">Full Statistics</h2>
        <table className="min-w-full text-sm bg-secondary rounded-lg overflow-hidden">
          <thead className="bg-gray-800">
            <tr>
              {[
                "APPEARANCE", "MOTM", "GOALS", "ASSISTS", "POSS WON", "POSS LOST", "POSS DIFF",
                "CLEAN SHEET", "🟨", "🟥", "SAVES", "PK SAVE", "AVG RATING", "SHOTS",
                "SHOT ACC (%)", "PASSES", "PASS ACC (%)", "DRIBBLES", "DRIBBLE SUC (%)",
                "TACKLES", "TACKLE SUC (%)", "OFFSIDES", "FOULS"
              ].map((header) => (
                <th key={header} className="p-2 whitespace-nowrap text-left">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="text-center bg-background border-t border-border">
              <td>{stats.appearance}</td>
              <td>{stats.motm}</td>
              <td>{stats.goals}</td>
              <td>{stats.assists}</td>
              <td>{stats.possessionWon}</td>
              <td>{stats.possessionLost}</td>
              <td>{stats.possessionDifference}</td>
              <td>{stats.cleanSheet}</td>
              <td>{stats.yellowCards}</td>
              <td>{stats.redCards}</td>
              <td>{stats.saves}</td>
              <td>{stats.pkSave}</td>
              <td>{(stats.avgRating / 10).toFixed(1)}</td>
              <td>{stats.shots}</td>
              <td>{stats.shotAccuracy}%</td>
              <td>{stats.passes}</td>
              <td>{stats.passAccuracy}%</td>
              <td>{stats.dribbles}</td>
              <td>{stats.dribbleSuccessRate}%</td>
              <td>{stats.tackles}</td>
              <td>{stats.tackleSuccessRate}%</td>
              <td>{stats.offsides}</td>
              <td>{stats.foulsCommitted}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
