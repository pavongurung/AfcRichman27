import { getFormationById, getPositionColor } from '@/lib/formations';
import { User } from 'lucide-react';
import type { Player } from '@shared/schema';

interface LineupViewProps {
  formation?: string;
  lineup?: Record<string, string>; // positionId -> playerId
  players?: Player[];
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export default function LineupView({
  formation = '4-3-3',
  lineup = {},
  players = [],
  className = '',
  size = 'medium'
}: LineupViewProps) {
  const formationData = getFormationById(formation);
  
  const getPlayerById = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  if (!formationData) {
    return (
      <div className={`text-center text-muted-foreground ${className}`}>
        Formation not available
      </div>
    );
  }

  // Size configurations
  const sizeConfig = {
    small: {
      width: 300,
      height: 420,
      playerSize: 'w-8 h-8',
      fontSize: 'text-[8px]',
      padding: 'p-2'
    },
    medium: {
      width: 400,
      height: 560,
      playerSize: 'w-10 h-10',
      fontSize: 'text-[9px]',
      padding: 'p-3'
    },
    large: {
      width: 500,
      height: 700,
      playerSize: 'w-12 h-12',
      fontSize: 'text-xs',
      padding: 'p-4'
    }
  };

  const config = sizeConfig[size];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Formation Label */}
      <div className="text-center">
        <h3 className="font-semibold text-lg">{formationData.name} Formation</h3>
        <p className="text-sm text-muted-foreground">
          {Object.keys(lineup).length}/11 players selected
        </p>
      </div>

      {/* Football Pitch */}
      <div 
        className={`relative bg-green-600 rounded-lg ${config.padding} mx-auto`}
        style={{ width: `${config.width}px`, height: `${config.height}px` }}
      >
        {/* Pitch markings */}
        <div className="absolute inset-2 border-2 border-white rounded">
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-16 h-16 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Goal boxes */}
          <div className="absolute left-1/4 right-1/4 bottom-0 h-12 border-2 border-white border-b-0"></div>
          <div className="absolute left-1/3 right-1/3 bottom-0 h-6 border-2 border-white border-b-0"></div>
          
          <div className="absolute left-1/4 right-1/4 top-0 h-12 border-2 border-white border-t-0"></div>
          <div className="absolute left-1/3 right-1/3 top-0 h-6 border-2 border-white border-t-0"></div>
        </div>

        {/* Player Positions */}
        {formationData.positions.map((position) => {
          const playerId = lineup[position.id];
          const player = playerId ? getPlayerById(playerId) : null;
          const colorClasses = getPositionColor(position.role);
          
          return (
            <div
              key={position.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${config.playerSize} rounded-full border-2 flex flex-col items-center justify-center text-white ${config.fontSize} font-bold ${colorClasses} ${
                player ? 'ring-2 ring-white' : ''
              }`}
              style={{
                left: `${(position.x / 100) * 100}%`,
                top: `${(position.y / 140) * 100}%`,
              }}
              data-testid={`lineup-position-${position.id}`}
            >
              {player ? (
                <>
                  {player.imageUrl ? (
                    <img 
                      src={player.imageUrl} 
                      alt={`${player.firstName} ${player.lastName}`}
                      className={`${config.playerSize} rounded-full object-cover`}
                      style={{ width: 'calc(100% - 4px)', height: 'calc(100% - 4px)' }}
                    />
                  ) : (
                    <div className="text-center leading-tight">
                      <div>{player.firstName.slice(0, 1)}.{player.lastName.slice(0, 3)}</div>
                      <div>#{player.jerseyNumber}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className={config.fontSize}>{position.label}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Player List (if lineup exists) */}
      {Object.keys(lineup).length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Starting XI</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {formationData.positions
              .filter(position => lineup[position.id])
              .map((position) => {
                const player = getPlayerById(lineup[position.id]);
                if (!player) return null;
                
                return (
                  <div 
                    key={position.id} 
                    className="flex items-center space-x-2 p-2 bg-muted/30 rounded"
                  >
                    <div className={`w-3 h-3 rounded-full ${getPositionColor(position.role)}`}></div>
                    <span className="font-medium">{position.label}:</span>
                    <span>{player.firstName} {player.lastName}</span>
                    <span className="text-muted-foreground">#{player.jerseyNumber}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}