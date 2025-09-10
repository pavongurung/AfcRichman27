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
} from "../components/ui/table";
import type { PlayerWithStats, PlayerStats } from "@shared/schema";

type SortField = keyof PlayerStats | "firstName";
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
      return <ChevronsUpDown className="ml-1 h-3 w-3 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? 
      <ChevronUp className="ml-1 h-3 w-3 text-primary" /> : 
      <ChevronDown className="ml-1 h-3 w-3 text-primary" />;
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
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-full mx-auto">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span>Squad</span>
            <span>›</span>
            <span>Statistics</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold italic">STATISTICS</h1>
            <div className="flex gap-4">
              <select className="bg-card text-foreground px-3 py-1 rounded text-sm border border-border">
                <option>All players</option>
              </select>
              <select className="bg-card text-foreground px-3 py-1 rounded text-sm border border-border">
                <option>All competitions</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead 
                  className="text-muted-foreground text-xs font-bold cursor-pointer hover:bg-secondary transition-colors py-4 px-3"
                  onClick={() => handleSort("firstName")}
                >
                  <div className="flex items-center">
                    PLAYER
                    <SortIcon field="firstName" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("appearance")}
                >
                  <div className="flex items-center justify-center">
                    APPEARANCE
                    <SortIcon field="appearance" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("motm")}
                >
                  <div className="flex items-center justify-center">
                    MOTM
                    <SortIcon field="motm" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("goals")}
                >
                  <div className="flex items-center justify-center">
                    GOALS
                    <SortIcon field="goals" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("assists")}
                >
                  <div className="flex items-center justify-center">
                    ASSISTS
                    <SortIcon field="assists" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("possessionWon")}
                >
                  <div className="flex items-center justify-center">
                    POS. WON
                    <SortIcon field="possessionWon" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("possessionLost")}
                >
                  <div className="flex items-center justify-center">
                    POS. LOST
                    <SortIcon field="possessionLost" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("possessionDifference")}
                >
                  <div className="flex items-center justify-center">
                    POS. DIFF
                    <SortIcon field="possessionDifference" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("cleanSheet")}
                >
                  <div className="flex items-center justify-center">
                    CLEAN SHEET
                    <SortIcon field="cleanSheet" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("yellowCards")}
                >
                  <div className="flex items-center justify-center">
                    YELLOW
                    <SortIcon field="yellowCards" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("redCards")}
                >
                  <div className="flex items-center justify-center">
                    RED
                    <SortIcon field="redCards" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("saves")}
                >
                  <div className="flex items-center justify-center">
                    SAVES
                    <SortIcon field="saves" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("pkSave")}
                >
                  <div className="flex items-center justify-center">
                    PK SAVE
                    <SortIcon field="pkSave" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("avgRating")}
                >
                  <div className="flex items-center justify-center">
                    AVG RATING
                    <SortIcon field="avgRating" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("shots")}
                >
                  <div className="flex items-center justify-center">
                    SHOTS
                    <SortIcon field="shots" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("shotAccuracy")}
                >
                  <div className="flex items-center justify-center">
                    SHOT ACC (%)
                    <SortIcon field="shotAccuracy" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("passes")}
                >
                  <div className="flex items-center justify-center">
                    PASSES
                    <SortIcon field="passes" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("passAccuracy")}
                >
                  <div className="flex items-center justify-center">
                    PASS ACC (%)
                    <SortIcon field="passAccuracy" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("dribbles")}
                >
                  <div className="flex items-center justify-center">
                    DRIBBLES
                    <SortIcon field="dribbles" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("dribbleSuccessRate")}
                >
                  <div className="flex items-center justify-center">
                    DRIBBLE SUCC RATE (%)
                    <SortIcon field="dribbleSuccessRate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("tackles")}
                >
                  <div className="flex items-center justify-center">
                    TACKLES
                    <SortIcon field="tackles" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("tackleSuccessRate")}
                >
                  <div className="flex items-center justify-center">
                    TACKLE SUCC RATE (%)
                    <SortIcon field="tackleSuccessRate" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("offsides")}
                >
                  <div className="flex items-center justify-center">
                    OFFSIDES
                    <SortIcon field="offsides" />
                  </div>
                </TableHead>
                <TableHead 
                  className="text-gray-300 text-xs font-semibold cursor-pointer hover:bg-gray-700 transition-colors text-center"
                  onClick={() => handleSort("foulsCommitted")}
                >
                  <div className="flex items-center justify-center">
                    FOULS COMMITTED
                    <SortIcon field="foulsCommitted" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlayers.map((player, index) => (
                <TableRow 
                  key={player.id} 
                  className={`${index % 2 === 0 ? 'bg-transparent' : 'bg-secondary/20'} hover:bg-secondary/40 border-0`}
                  data-testid={`player-row-${player.id}`}
                >
                  <TableCell className="text-foreground font-medium text-sm py-3 px-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-muted-foreground font-bold w-6 text-center">{player.jerseyNumber}</span>
                      <span>{player.firstName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`appearance-${player.id}`}>
                    {player.stats?.appearance || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`motm-${player.id}`}>
                    {player.stats?.motm || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3 font-semibold" data-testid={`goals-${player.id}`}>
                    {player.stats?.goals || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3 font-semibold" data-testid={`assists-${player.id}`}>
                    {player.stats?.assists || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`possession-won-${player.id}`}>
                    {player.stats?.possessionWon || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`possession-lost-${player.id}`}>
                    {player.stats?.possessionLost || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`possession-diff-${player.id}`}>
                    {player.stats?.possessionDifference || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`clean-sheet-${player.id}`}>
                    {player.stats?.cleanSheet || 0}
                  </TableCell>
                  <TableCell className="text-center text-sm py-3 px-3" data-testid={`yellow-cards-${player.id}`}>
                    <span className="text-yellow-400 font-semibold">{player.stats?.yellowCards || 0}</span>
                  </TableCell>
                  <TableCell className="text-center text-sm py-3 px-3" data-testid={`red-cards-${player.id}`}>
                    <span className="text-red-400 font-semibold">{player.stats?.redCards || 0}</span>
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`saves-${player.id}`}>
                    {player.stats?.saves || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`pk-save-${player.id}`}>
                    {player.stats?.pkSave || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`avg-rating-${player.id}`}>
                    {player.stats?.avgRating ? (player.stats.avgRating / 10).toFixed(1) : "0.0"}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`shots-${player.id}`}>
                    {player.stats?.shots || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`shot-accuracy-${player.id}`}>
                    {player.stats?.shotAccuracy || 0}%
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`passes-${player.id}`}>
                    {player.stats?.passes || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`pass-accuracy-${player.id}`}>
                    {player.stats?.passAccuracy || 0}%
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`dribbles-${player.id}`}>
                    {player.stats?.dribbles || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`dribble-success-${player.id}`}>
                    {player.stats?.dribbleSuccessRate || 0}%
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`tackles-${player.id}`}>
                    {player.stats?.tackles || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`tackle-success-${player.id}`}>
                    {player.stats?.tackleSuccessRate || 0}%
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`offsides-${player.id}`}>
                    {player.stats?.offsides || 0}
                  </TableCell>
                  <TableCell className="text-white text-center text-sm py-3 px-3" data-testid={`fouls-committed-${player.id}`}>
                    {player.stats?.foulsCommitted || 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
    </div>
  );
}