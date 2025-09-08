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
                  <TableHead className="text-left font-semibold">APPEARANCE</TableHead>
                  <TableHead className="text-left font-semibold">MOTM</TableHead>
                  <TableHead className="text-left font-semibold">GOALS</TableHead>
                  <TableHead className="text-left font-semibold">ASSISTS</TableHead>
                  <TableHead className="text-left font-semibold">POSS WON</TableHead>
                  <TableHead className="text-left font-semibold">POSS LOST</TableHead>
                  <TableHead className="text-left font-semibold">POSS DIFF</TableHead>
                  <TableHead className="text-left font-semibold">CLEAN SHEET</TableHead>
                  <TableHead className="text-left font-semibold">🟨</TableHead>
                  <TableHead className="text-left font-semibold">🟥</TableHead>
                  <TableHead className="text-left font-semibold">SAVES</TableHead>
                  <TableHead className="text-left font-semibold">PK SAVE</TableHead>
                  <TableHead className="text-left font-semibold">AVG RATING</TableHead>
                  <TableHead className="text-left font-semibold">SHOTS</TableHead>
                  <TableHead className="text-left font-semibold">SHOT ACC (%)</TableHead>
                  <TableHead className="text-left font-semibold">PASSES</TableHead>
                  <TableHead className="text-left font-semibold">PASS ACC (%)</TableHead>
                  <TableHead className="text-left font-semibold">DRIBBLES</TableHead>
                  <TableHead className="text-left font-semibold">DRIBBLE SUC (%)</TableHead>
                  <TableHead className="text-left font-semibold">TACKLES</TableHead>
                  <TableHead className="text-left font-semibold">TACKLE SUC (%)</TableHead>
                  <TableHead className="text-left font-semibold">OFFSIDES</TableHead>
                  <TableHead className="text-left font-semibold">FOULS</TableHead>
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
                      <TableCell>{player.stats?.appearance || 0}</TableCell>
                      <TableCell>{player.stats?.motm || 0}</TableCell>
                      <TableCell>{player.stats?.goals || 0}</TableCell>
                      <TableCell>{player.stats?.assists || 0}</TableCell>
                      <TableCell>{player.stats?.possessionWon || 0}</TableCell>
                      <TableCell>{player.stats?.possessionLost || 0}</TableCell>
                      <TableCell>{player.stats?.possessionDifference || 0}</TableCell>
                      <TableCell>{player.stats?.cleanSheet || 0}</TableCell>
                      <TableCell>{player.stats?.yellowCards || 0}</TableCell>
                      <TableCell>{player.stats?.redCards || 0}</TableCell>
                      <TableCell>{player.stats?.saves || 0}</TableCell>
                      <TableCell>{player.stats?.pkSave || 0}</TableCell>
                      <TableCell>{player.stats?.avgRating ? (player.stats.avgRating / 10).toFixed(1) : '0.0'}</TableCell>
                      <TableCell>{player.stats?.shots || 0}</TableCell>
                      <TableCell>{player.stats?.shotAccuracy || 0}%</TableCell>
                      <TableCell>{player.stats?.passes || 0}</TableCell>
                      <TableCell>{player.stats?.passAccuracy || 0}%</TableCell>
                      <TableCell>{player.stats?.dribbles || 0}</TableCell>
                      <TableCell>{player.stats?.dribbleSuccessRate || 0}%</TableCell>
                      <TableCell>{player.stats?.tackles || 0}</TableCell>
                      <TableCell>{player.stats?.tackleSuccessRate || 0}%</TableCell>
                      <TableCell>{player.stats?.offsides || 0}</TableCell>
                      <TableCell>{player.stats?.foulsCommitted || 0}</TableCell>
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
