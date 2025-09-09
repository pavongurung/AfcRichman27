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

      {/* AFC Richman Half Pitch */}
      <div 
        className="relative bg-gray-900 rounded-lg mx-auto overflow-hidden"
        style={{ 
          width: '800px', 
          height: '600px',
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

        {/* Half Pitch Markings */}
        <div className="absolute inset-4">
          {/* Outer Border (3 sides) */}
          <div className="absolute inset-0 border-l-2 border-t-2 border-b-2 border-white/20 rounded-l"></div>
          
          {/* Center Line (right edge) */}
          <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white/20"></div>
          
          {/* Half Center Circle */}
          <div 
            className="absolute right-0 top-1/2 w-24 h-24 border-2 border-white/20 rounded-l-full transform -translate-y-1/2"
            style={{ borderRight: 'none' }}
          ></div>
          <div className="absolute right-0 top-1/2 w-2 h-2 bg-white/20 rounded-full transform -translate-y-1/2"></div>
          
          {/* Goal Area (AFC Richman defends left side) */}
          <div className="absolute left-0 top-1/4 bottom-1/4 w-16 border-2 border-white/20 border-l-0 rounded-r"></div>
          <div className="absolute left-0 top-1/3 bottom-1/3 w-8 border-2 border-white/20 border-l-0"></div>
          
          {/* Goalpost */}
          <div className="absolute left-0 top-1/3 w-1 h-1/3 bg-white/40"></div>
        </div>

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
                left: `${(position.y / 140) * 75 + 12.5}%`,
                top: `${(position.x / 100) * 70 + 15}%`,
              }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  {/* Jersey with Name */}
                  <div className={`relative w-24 h-28 ${colorClass} rounded-lg shadow-lg border-2 border-white flex flex-col items-center justify-center transform hover:scale-110 transition-transform`}>
                    {/* Jersey Shape Details */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/60 rounded"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 border-2 border-white/40 rounded-t"></div>
                    
                    {/* Player Name Inside Jersey */}
                    <div className="text-center px-2">
                      <div className="text-white font-semibold text-sm leading-tight">
                        {player.firstName}
                      </div>
                      <div className="text-white font-semibold text-sm leading-tight">
                        {player.lastName}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Empty Jersey */}
                  <div className="relative w-24 h-28 bg-gray-700 rounded-lg shadow-lg border-2 border-white/30 flex flex-col items-center justify-center opacity-50">
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white/30 rounded"></div>
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 border-2 border-white/20 rounded-t"></div>
                    
                    <div className="text-white/60 font-bold text-sm text-center px-2">
                      {position.label}
                    </div>
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