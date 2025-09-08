import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import type { PlayerWithStats } from "@shared/schema";

export default function Statistics() {
  const [selectedCompetition, setSelectedCompetition] = useState<string>("all");

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
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-16 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" data-testid="statistics-title">
            <span className="text-primary italic mr-2">STATISTICS</span>
          </h2>
          <div className="flex items-center space-x-4">
            <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
              <SelectTrigger className="w-48" data-testid="competition-filter">
                <SelectValue placeholder="All competitions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All competitions</SelectItem>
                <SelectItem value="premier-league">Premier League</SelectItem>
                <SelectItem value="champions-league">Champions League</SelectItem>
                <SelectItem value="fa-cup">FA Cup</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Statistics table */}
        <div className="bg-card rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary">
                  <TableHead className="text-left font-semibold">NO.</TableHead>
                  <TableHead className="text-left font-semibold">LAST NAME</TableHead>
                  <TableHead className="text-left font-semibold">FIRST NAME</TableHead>
                  <TableHead className="text-left font-semibold">POSITION</TableHead>
                  <TableHead className="text-left font-semibold">NAT.</TableHead>
                  <TableHead className="text-left font-semibold">GAMES PLAYED</TableHead>
                  <TableHead className="text-left font-semibold">MINUTES</TableHead>
                  <TableHead className="text-left font-semibold">GOALS</TableHead>
                  <TableHead className="text-left font-semibold">ASSISTS</TableHead>
                  <TableHead className="text-left font-semibold">🟨</TableHead>
                  <TableHead className="text-left font-semibold">🟥</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playersWithStats
                  ?.sort((a, b) => a.jerseyNumber - b.jerseyNumber)
                  .map((player) => (
                    <TableRow 
                      key={player.id} 
                      className="border-b border-border hover:bg-muted/20 transition-colors"
                      data-testid={`stats-row-${player.id}`}
                    >
                      <TableCell className="font-semibold">{player.jerseyNumber}</TableCell>
                      <TableCell>{player.lastName}</TableCell>
                      <TableCell>{player.firstName}</TableCell>
                      <TableCell>{player.position}</TableCell>
                      <TableCell>{player.nationality}</TableCell>
                      <TableCell>{player.stats?.gamesPlayed || 0}</TableCell>
                      <TableCell>{player.stats?.minutes || 0}</TableCell>
                      <TableCell>{player.stats?.goals || 0}</TableCell>
                      <TableCell>{player.stats?.assists || 0}</TableCell>
                      <TableCell>{player.stats?.yellowCards || 0}</TableCell>
                      <TableCell>{player.stats?.redCards || 0}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </section>
  );
}
