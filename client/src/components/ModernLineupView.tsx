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
    switch (role) {
      case 'GK':
        return 'bg-yellow-500';
      case 'DEF':
        return 'bg-blue-500';
      case 'MID':
        return 'bg-green-500';
      case 'FWD':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Team Name */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{teamName}</h3>
        <div className="text-gray-400 text-sm mt-2">Formation: {formation}</div>
      </div>

      {/* Pitch Background */}
      <div 
        className="relative bg-gradient-to-b from-green-800 to-green-900 rounded-lg mx-auto overflow-hidden"
        style={{ 
          width: '900px', 
          height: '700px',
          backgroundImage: `
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      >
        {/* Pitch Markings */}
        <div className="absolute inset-4">
          {/* Outer Border */}
          <div className="absolute inset-0 border-2 border-white/20 rounded"></div>
          
          {/* Center Circle */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 border-2 border-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white/20 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Center Line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white/20 transform -translate-y-1/2"></div>
          
          {/* Goal Areas */}
          <div className="absolute left-1/4 right-1/4 bottom-0 h-20 border-2 border-white/20 border-b-0 rounded-t"></div>
          <div className="absolute left-1/3 right-1/3 bottom-0 h-12 border-2 border-white/20 border-b-0"></div>
          
          <div className="absolute left-1/4 right-1/4 top-0 h-20 border-2 border-white/20 border-t-0 rounded-b"></div>
          <div className="absolute left-1/3 right-1/3 top-0 h-12 border-2 border-white/20 border-t-0"></div>
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
                left: `${(position.x / 100) * 85 + 7.5}%`,
                top: `${(position.y / 140) * 80 + 10}%`,
              }}
            >
              {player ? (
                <div className="flex flex-col items-center">
                  {/* Jersey */}
                  <div className={`relative w-16 h-20 ${colorClass} rounded-lg shadow-lg border-2 border-white/30 flex items-center justify-center mb-3 transform hover:scale-110 transition-transform`}>
                    {/* Jersey Number */}
                    <div className="text-white font-bold text-lg">
                      {player.jerseyNumber}
                    </div>
                    
                    {/* Jersey Details */}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-white/30 rounded"></div>
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-white/30 rounded"></div>
                  </div>
                  
                  {/* Player Name */}
                  <div className="text-center min-w-[80px] px-1">
                    <div className="text-white font-semibold text-xs leading-tight bg-black/40 rounded px-2 py-1 backdrop-blur-sm">
                      {player.firstName}
                    </div>
                    <div className="text-white font-semibold text-xs leading-tight bg-black/40 rounded px-2 py-1 mt-1 backdrop-blur-sm">
                      {player.lastName}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Empty Jersey */}
                  <div className="relative w-16 h-20 bg-gray-600 rounded-lg shadow-lg border-2 border-white/20 flex items-center justify-center mb-3 opacity-50">
                    <div className="text-white/50 font-bold text-xs">
                      {position.label}
                    </div>
                  </div>
                  <div className="text-gray-500 text-xs min-w-[80px] text-center bg-black/40 rounded px-2 py-1">
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
        <div className="inline-flex items-center gap-6 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Goalkeeper</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Defenders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Midfielders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Forwards</span>
          </div>
        </div>
      </div>
    </div>
  );
}