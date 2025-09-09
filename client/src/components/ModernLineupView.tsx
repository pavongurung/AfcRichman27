import type { Player } from "@shared/schema";
import { getFormationById, getPositionColor } from "@/lib/formations";

interface ModernLineupViewProps {
  formation?: string;
  lineup?: Record<string, string>;
  players: Player[];
  teamName: string;
}

const ModernLineupView = ({
  formation = '4-3-3',
  lineup = {},
  players,
  teamName
}: ModernLineupViewProps) => {
  const formationData = getFormationById(formation);
  if (!formationData) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400">Formation not found</div>
      </div>
    );
  }

  const getPlayerById = (playerId: string) =>
    players.find(p => p.id === playerId);

  const getPlayerColor = (role: string) => {
    switch (role) {
      case 'GK':
        return 'bg-yellow-500 border-yellow-400';
      case 'DEF':
        return 'bg-blue-500 border-blue-400';
      case 'MID':
        return 'bg-green-500 border-green-400';
      case 'FWD':
        return 'bg-red-500 border-red-400';
      default:
        return 'bg-gray-500 border-gray-400';
    }
  };

  // Create lineup for display below pitch
  const positionedPlayers = formationData.positions.map(position => {
    const playerId = lineup[position.id];
    const player = playerId ? getPlayerById(playerId) : null;
    return {
      position,
      player,
      colorClass: getPlayerColor(position.role)
    };
  });

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      {/* Formation Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">{formation} Formation</h3>
        <p className="text-gray-400">11/11 players selected</p>
      </div>

      {/* Football Pitch */}
      <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl mx-auto border-4 border-white" 
           style={{ width: '800px', height: '500px' }}>
        
        {/* Pitch markings */}
        <div className="absolute inset-4 border-4 border-white rounded-lg">
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-24 h-24 border-4 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-white transform -translate-y-1/2"></div>
          
          {/* Goal areas - top */}
          <div className="absolute left-1/4 right-1/4 top-0 h-16 border-4 border-white border-t-0 rounded-b-lg"></div>
          <div className="absolute left-1/3 right-1/3 top-0 h-10 border-4 border-white border-t-0 rounded-b"></div>
          
          {/* Goal areas - bottom */}
          <div className="absolute left-1/4 right-1/4 bottom-0 h-16 border-4 border-white border-b-0 rounded-t-lg"></div>
          <div className="absolute left-1/3 right-1/3 bottom-0 h-10 border-4 border-white border-b-0 rounded-t"></div>
          
          {/* Corner arcs */}
          <div className="absolute top-0 left-0 w-6 h-6 border-r-4 border-b-4 border-white rounded-br-full"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-l-4 border-b-4 border-white rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-r-4 border-t-4 border-white rounded-tr-full"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-l-4 border-t-4 border-white rounded-tl-full"></div>
        </div>

        {/* Player Positions */}
        {formationData.positions.map((position) => {
          const playerId = lineup[position.id];
          const player = playerId ? getPlayerById(playerId) : null;
          const colorClass = getPlayerColor(position.role);
          
          return (
            <div
              key={position.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 flex flex-col items-center justify-center text-white font-bold transition-transform hover:scale-110 cursor-pointer ${colorClass} shadow-lg`}
              style={{
                left: `${(position.x / 100) * 100}%`,
                top: `${(position.y / 140) * 100}%`,
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
              }}
              title={player ? `${player.firstName} ${player.lastName} (#${player.jerseyNumber})` : position.label}
              data-testid={`lineup-position-${position.id}`}
            >
              {player ? (
                <>
                  <div className="text-xs leading-none">
                    {player.lastName.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="text-xs leading-none mt-1">
                    #{player.jerseyNumber}
                  </div>
                </>
              ) : (
                <div className="text-xs">{position.label}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Starting XI List */}
      <div className="mt-12">
        <h4 className="text-xl font-bold text-white mb-6 text-center">Starting XI</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {positionedPlayers.map(({ position, player, colorClass }) => (
            <div key={position.id} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-xs font-bold ${colorClass}`}>
                {position.role}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">
                  {player ? `${player.firstName} ${player.lastName}` : 'Unnamed Player'}
                </div>
                <div className="text-gray-400 text-xs">
                  {position.label} #{player?.jerseyNumber || '??'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernLineupView;