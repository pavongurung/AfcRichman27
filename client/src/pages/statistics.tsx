import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerWithStats } from "@shared/schema";

type SortField = keyof PlayerWithStats["stats"] | "firstName" | "position" | "jerseyNumber";
type SortDirection = "asc" | "desc" | null;

export default function Statistics() {
  const [sortField, setSortField] = useState<SortField>("goals");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const { data: playersWithStats, isLoading } = useQuery<PlayerWithStats[]>({
    queryKey: ["/api/players-with-stats"],
    queryFn: async () => {
      const response = await fetch("/api/players-with-stats");
      if (!response.ok) throw new Error("Failed to fetch players with stats");
      return response.json();
    },
  });

  // Sorting function
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: desc -> asc -> null -> desc
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection(null);
        setSortField("goals"); // Default back to goals
      } else {
        setSortDirection("desc");
      }
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Sort the data
  const sortedPlayers = playersWithStats ? [...playersWithStats].sort((a, b) => {
    if (!sortDirection) return 0;

    let aValue: number | string;
    let bValue: number | string;

    if (sortField === "firstName") {
      aValue = a.firstName;
      bValue = b.firstName;
    } else if (sortField === "position") {
      aValue = a.position;
      bValue = b.position;
    } else if (sortField === "jerseyNumber") {
      aValue = a.jerseyNumber;
      bValue = b.jerseyNumber;
    } else {
      aValue = a.stats?.[sortField] || 0;
      bValue = b.stats?.[sortField] || 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }

    const numA = Number(aValue);
    const numB = Number(bValue);
    return sortDirection === "asc" ? numA - numB : numB - numA;
  }) : [];

  // Helper function to render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortDirection) {
      return <ChevronsUpDown className="ml-1 h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? 
      <ChevronUp className="ml-1 h-4 w-4 text-primary" /> : 
      <ChevronDown className="ml-1 h-4 w-4 text-primary" />;
  };

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
      <div className="max-w-full mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">Team Statistics</h1>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary">
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("firstName")}
                >
                  <div className="flex items-center">
                    Player
                    <SortIcon field="firstName" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("position")}
                >
                  <div className="flex items-center">
                    Position
                    <SortIcon field="position" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("appearance")}
                >
                  <div className="flex items-center">
                    Apps
                    <SortIcon field="appearance" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("goals")}
                >
                  <div className="flex items-center">
                    Goals
                    <SortIcon field="goals" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("assists")}
                >
                  <div className="flex items-center">
                    Assists
                    <SortIcon field="assists" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("shots")}
                >
                  <div className="flex items-center">
                    Shots
                    <SortIcon field="shots" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("shotAccuracy")}
                >
                  <div className="flex items-center">
                    Shot Acc%
                    <SortIcon field="shotAccuracy" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("passes")}
                >
                  <div className="flex items-center">
                    Passes
                    <SortIcon field="passes" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("passAccuracy")}
                >
                  <div className="flex items-center">
                    Pass Acc%
                    <SortIcon field="passAccuracy" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("dribbles")}
                >
                  <div className="flex items-center">
                    Dribbles
                    <SortIcon field="dribbles" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("tackles")}
                >
                  <div className="flex items-center">
                    Tackles
                    <SortIcon field="tackles" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("foulsCommitted")}
                >
                  <div className="flex items-center">
                    Fouls
                    <SortIcon field="foulsCommitted" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("possessionWon")}
                >
                  <div className="flex items-center">
                    Poss Won
                    <SortIcon field="possessionWon" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("minutesPlayed")}
                >
                  <div className="flex items-center">
                    Minutes
                    <SortIcon field="minutesPlayed" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("yellowCards")}
                >
                  <div className="flex items-center">
                    🟨
                    <SortIcon field="yellowCards" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("redCards")}
                >
                  <div className="flex items-center">
                    🟥
                    <SortIcon field="redCards" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={() => handleSort("avgRating")}
                >
                  <div className="flex items-center">
                    Rating
                    <SortIcon field="avgRating" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player) => (
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
                  <TableCell>{player.stats?.appearance || 0}</TableCell>
                  <TableCell className="font-semibold text-green-400">{player.stats?.goals || 0}</TableCell>
                  <TableCell className="font-semibold text-blue-400">{player.stats?.assists || 0}</TableCell>
                  <TableCell>{player.stats?.shots || 0}</TableCell>
                  <TableCell>{player.stats?.shotAccuracy || 0}%</TableCell>
                  <TableCell>{player.stats?.passes || 0}</TableCell>
                  <TableCell>{player.stats?.passAccuracy || 0}%</TableCell>
                  <TableCell>{player.stats?.dribbles || 0}</TableCell>
                  <TableCell>{player.stats?.tackles || 0}</TableCell>
                  <TableCell>{player.stats?.foulsCommitted || 0}</TableCell>
                  <TableCell>{player.stats?.possessionWon || 0}</TableCell>
                  <TableCell>{player.stats?.minutesPlayed || 0}</TableCell>
                  <TableCell className="text-yellow-400">{player.stats?.yellowCards || 0}</TableCell>
                  <TableCell className="text-red-400">{player.stats?.redCards || 0}</TableCell>
                  <TableCell>
                    {player.stats?.avgRating ? (player.stats.avgRating / 10).toFixed(1) : "0.0"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Team Summary */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-green-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.goals || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Goals</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-blue-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.assists || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Assists</p>
          </div>

          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-purple-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.shots || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Shots</p>
          </div>

          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-cyan-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.passes || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Total Passes</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-yellow-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.yellowCards || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Yellow Cards</p>
          </div>
          
          <div className="bg-secondary p-6 rounded-lg text-center">
            <h3 className="text-2xl font-bold text-red-400">
              {sortedPlayers.reduce((sum, player) => sum + (player.stats?.redCards || 0), 0)}
            </h3>
            <p className="text-muted-foreground">Red Cards</p>
          </div>
        </div>
      </div>
    </div>
  );
}