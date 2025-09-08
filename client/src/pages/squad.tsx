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

  const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

  const getPlayersByPosition = (position: string) => {
    return players?.filter(player => player.position === position) || [];
  };

  const PlayerCard = ({ player }: { player: Player }) => (
    <Link
      href={`/player/${player.id}`}
      className="bg-card rounded-lg overflow-hidden player-card cursor-pointer"
      data-testid={`squad-player-${player.id}`}
    >
      <div 
        className="relative h-48 bg-cover bg-center"
        style={{
          backgroundImage: `url('${player.imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=400'}')`
        }}
      >
        <div className="absolute top-2 left-2 bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
          {player.jerseyNumber}
        </div>
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm">
          {player.firstName} {player.lastName}
        </div>
        <div className="text-xs text-muted-foreground">{player.position}</div>
      </div>
    </Link>
  );

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
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold" data-testid="squad-title">
            <span className="text-primary italic mr-2">SQUAD</span>
          </h2>
          <div className="flex items-center space-x-4">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-48" data-testid="position-filter">
                <SelectValue placeholder="All players" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All players</SelectItem>
                <SelectItem value="Goalkeeper">Goalkeepers</SelectItem>
                <SelectItem value="Defender">Defenders</SelectItem>
                <SelectItem value="Midfielder">Midfielders</SelectItem>
                <SelectItem value="Forward">Forwards</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedPosition === "all" ? (
          <>
            {/* Goalkeepers */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-6" data-testid="goalkeepers-section">Goalkeepers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPlayersByPosition("Goalkeeper").map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
            
            {/* Defenders */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-6" data-testid="defenders-section">Defenders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPlayersByPosition("Defender").map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
            
            {/* Midfielders */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-6" data-testid="midfielders-section">Midfielders</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPlayersByPosition("Midfielder").map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
            
            {/* Forwards */}
            <div className="mb-12">
              <h3 className="text-xl font-semibold mb-6" data-testid="forwards-section">Forwards</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {getPlayersByPosition("Forward").map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {players?.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
