import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerWithStats } from "@shared/schema";

export default function Statistics() {
  const { data: playersWithStats, isLoading } = useQuery<PlayerWithStats[]>({
    queryKey: ["/api/players-with-stats"],
    queryFn: async () => {
      const response = await fetch("/api/players-with-stats");
      if (!response.ok) throw new Error("Failed to fetch players with stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading statistics...
      </div>
    );
  }

  if (!playersWithStats || playersWithStats.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        No statistics available
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Team Statistics</h1>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead>Player</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Games</TableHead>
                <TableHead>Minutes</TableHead>
                <TableHead>Goals</TableHead>
                <TableHead>Assists</TableHead>
                <TableHead>🟨</TableHead>
                <TableHead>🟥</TableHead>
                <TableHead>Starts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playersWithStats.map((player) => (
                <TableRow key={player.id} className="hover:bg-secondary/50">
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {player.jerseyNumber}
                      </div>
                      <span>{player.firstName} {player.lastName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{player.position}</TableCell>
                  <TableCell>{player.stats?.gamesPlayed || 0}</TableCell>
                  <TableCell>{player.stats?.minutes || 0}</TableCell>
                  <TableCell>{player.stats?.goals || 0}</TableCell>
                  <TableCell>{player.stats?.assists || 0}</TableCell>
                  <TableCell>{player.stats?.yellowCards || 0}</TableCell>
                  <TableCell>{player.stats?.redCards || 0}</TableCell>
                  <TableCell>{player.stats?.starts || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Team Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-primary">
              {playersWithStats.reduce((sum, player) => sum + (player.stats?.goals || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Goals</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-primary">
              {playersWithStats.reduce((sum, player) => sum + (player.stats?.assists || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Assists</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-primary">
              {playersWithStats.reduce((sum, player) => sum + (player.stats?.yellowCards || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Yellow Cards</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-primary">
              {playersWithStats.reduce((sum, player) => sum + (player.stats?.redCards || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Red Cards</p>
          </div>
        </div>
      </div>
    </div>
  );
}