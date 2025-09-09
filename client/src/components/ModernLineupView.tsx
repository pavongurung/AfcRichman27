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

      {/* Full Football Pitch */}
      <div 
        className="relative bg-green-800 rounded-lg mx-auto overflow-hidden"
        style={{ 
          width: '1000px', 
          height: '650px',
          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              rgba(0,0,0,0.05),
              rgba(0,0,0,0.05) 10px,
              transparent 10px,
              transparent 20px
            )
          `
        }}
      >

        {/* Football Pitch Markings */}
        <div className="absolute inset-6">
          {/* Outer Border */}
          <div className="absolute inset-0 border-2 border-white rounded-lg"></div>
          
          {/* Center Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white transform -translate-x-1/2"></div>
          
          {/* Center Circle */}
          <div className="absolute left-1/2 top-1/2 w-32 h-32 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Left Goal Area */}
          <div className="absolute left-0 top-1/2 w-20 h-24 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
          <div className="absolute left-0 top-1/2 w-12 h-16 border-2 border-white border-l-0 transform -translate-y-1/2"></div>
          
          {/* Right Goal Area */}
          <div className="absolute right-0 top-1/2 w-20 h-24 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 w-12 h-16 border-2 border-white border-r-0 transform -translate-y-1/2"></div>
          
          {/* Goals */}
          <div className="absolute left-0 top-1/2 w-1 h-12 bg-white transform -translate-y-1/2"></div>
          <div className="absolute right-0 top-1/2 w-1 h-12 bg-white transform -translate-y-1/2"></div>
          
          {/* Corner Arcs */}
          <div className="absolute left-0 top-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-full"></div>
          <div className="absolute right-0 top-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-full"></div>
          <div className="absolute left-0 bottom-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-full"></div>
          <div className="absolute right-0 bottom-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-full"></div>
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
                left: `${(position.y / 140) * 35 + 32.5}%`,
                top: `${(position.x / 100) * 75 + 12.5}%`,
              }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  {/* Jersey with Number */}
                  <div className={`relative w-16 h-20 ${colorClass} rounded-lg shadow-lg border-2 border-white flex items-center justify-center transform hover:scale-110 transition-transform mb-2`}>
                    {/* Jersey Shape Details */}
                    <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white/60 rounded"></div>
                    <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-3 h-2 border-2 border-white/40 rounded-t"></div>
                    
                    {/* Jersey Number */}
                    <div className="text-white font-bold text-lg">
                      {player.jerseyNumber}
                    </div>
                  </div>
                  
                  {/* Player Name Below Jersey */}
                  <div className="text-center min-w-[80px]">
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
                  <div className="relative w-16 h-20 bg-gray-700 rounded-lg shadow-lg border-2 border-white/30 flex items-center justify-center opacity-50 mb-2">
                    <div className="absolute top-1.5 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-white/30 rounded"></div>
                    <div className="absolute top-0.5 left-1/2 transform -translate-x-1/2 w-3 h-2 border-2 border-white/20 rounded-t"></div>
                    
                    <div className="text-white/60 font-bold text-xs">
                      ?
                    </div>
                  </div>
                  
                  {/* Position Label Below */}
                  <div className="text-gray-500 text-xs text-center min-w-[80px]">
                    {position.label}
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