import type { Player } from "@shared/schema";
import { getFormationById } from "@/lib/formations";

interface ModernLineupViewProps {
  formation?: string;
  lineup?: Record<string, string>;
  players: Player[];
  teamName: string;
}

export default function ModernLineupView({
  formation = '4-3-3',
  lineup = {},
  players,
  teamName
}: ModernLineupViewProps) {
  const formationData = getFormationById(formation);
  
  if (!formationData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Formation not found</div>
      </div>
    );
  }

  const getPlayerById = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const getPositionColor = (role: string) => {
    // All jerseys are the same gray color for minimalistic design
    return 'bg-gray-600';
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Team Name */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{teamName}</h3>
        <div className="text-gray-400 text-sm mt-2">Formation: {formation}</div>
      </div>

      {/* Minimalistic Background */}
      <div 
        className="relative bg-gray-900 rounded-lg mx-auto overflow-hidden"
        style={{ 
          width: '900px', 
          height: '700px',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              rgba(255,255,255,0.02) 20px,
              rgba(255,255,255,0.02) 40px
            )
          `
        }}
      >

        {/* Player Positions */}
        {formationData.positions.map((position) => {
          const playerId = lineup[position.id];
          const player = playerId ? getPlayerById(playerId) : null;
          const colorClass = getPositionColor(position.role);
          
          return (
            <div
              key={position.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(position.x / 100) * 85 + 7.5}%`,
                top: `${(position.y / 140) * 80 + 10}%`,
              }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  {/* Jersey */}
                  <div className={`relative w-16 h-20 ${colorClass} rounded-lg shadow-lg border-2 border-white flex items-center justify-center mb-3 transform hover:scale-110 transition-transform`}>
                    {/* Jersey Number */}
                    <div className="text-white font-bold text-lg">
                      {player.jerseyNumber}
                    </div>
                    
                    {/* Jersey Shape Details */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/60 rounded"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 border-2 border-white/40 rounded-t"></div>
                  </div>
                  
                  {/* Player Name */}
                  <div className="text-center min-w-[100px] px-1">
                    <div className="text-white font-semibold text-sm leading-tight">
                      {player.firstName}
                    </div>
                    <div className="text-white font-semibold text-sm leading-tight">
                      {player.lastName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Empty Jersey */}
                  <div className="relative w-16 h-20 bg-gray-700 rounded-lg shadow-lg border-2 border-white/30 flex items-center justify-center mb-3 opacity-50">
                    <div className="text-white/60 font-bold text-xs">
                      {position.label}
                    </div>
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 border-2 border-white/20 rounded-t"></div>
                  </div>
                  <div className="text-gray-500 text-sm min-w-[100px] text-center">
                    No Player
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Formation Info */}
      <div className="mt-8 text-center">
        <div className="text-gray-400 text-sm">
          {formation} Formation
        </div>
      </div>
    </div>
  );
}