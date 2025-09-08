import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import type { Player } from "@shared/schema";

export default function Squad() {
  const [selectedPosition, setSelectedPosition] = useState<string>("all");

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ["/api/players", selectedPosition],
    queryFn: async () => {
      const url = selectedPosition === "all" 
        ? "/api/players" 
        : `/api/players?position=${selectedPosition}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
  });

  const getPlayersByPosition = (position: string) => {
    return players?.filter(player => player.position === position) || [];
  };

  const PlayerCard = ({ player }: { player: Player }) => (
    <Link
      href={`/player/${player.id}`}
      className="block cursor-pointer group"
      data-testid={`squad-player-${player.id}`}
    >
      <div className="bg-card rounded-lg overflow-hidden transition-transform duration-300 hover:scale-105">
        <div 
          className="relative h-64 bg-cover bg-center bg-black"
          style={{
            backgroundImage: `url('${player.imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400'}')`
          }}
        >
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
            {player.jerseyNumber}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        <div className="p-4 text-center">
          <div className="font-bold text-lg mb-1">
            {player.firstName}
          </div>
          <div className="font-semibold text-base text-muted-foreground">
            @{player.consoleUsername}
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center min-h-96">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-12">
          <h1 className="text-5xl font-bold text-foreground" data-testid="squad-title">
            SQUAD
          </h1>
          <div className="flex items-center space-x-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-48 bg-card border-border" data-testid="position-filter">
                <SelectValue placeholder="All players" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All players</SelectItem>
                <SelectItem value="Goalkeeper">Goal</SelectItem>
                <SelectItem value="Defender">Defender</SelectItem>
                <SelectItem value="Midfielder">Midfielder</SelectItem>
                <SelectItem value="Forward">Forward</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedPosition === "all" ? (
          <div className="space-y-16">
            {/* Goal */}
            {getPlayersByPosition("Goalkeeper").length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-foreground" data-testid="goalkeepers-section">Goal</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {getPlayersByPosition("Goalkeeper").map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Defender */}
            {getPlayersByPosition("Defender").length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-foreground" data-testid="defenders-section">Defender</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {getPlayersByPosition("Defender").map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Midfielder */}
            {getPlayersByPosition("Midfielder").length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-foreground" data-testid="midfielders-section">Midfielder</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {getPlayersByPosition("Midfielder").map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Forward */}
            {getPlayersByPosition("Forward").length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-8 text-foreground" data-testid="forwards-section">Forward</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
                  {getPlayersByPosition("Forward").map((player) => (
                    <PlayerCard key={player.id} player={player} />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
            {players?.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}