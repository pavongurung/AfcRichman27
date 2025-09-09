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

  const getPlayerById = (playerId: string) =>
    players.find(p => p.id === playerId);

  // Map formation position IDs to CSS positioning
  const getPositionStyle = (position: any) => {
    const positionMap: Record<string, { top: string; left: string }> = {
      'GK': { top: '48%', left: '2%' },
      'LB': { top: '10%', left: '14%' },
      'CB1': { top: '35%', left: '14%' },
      'CB2': { top: '65%', left: '14%' },
      'RB': { top: '85%', left: '14%' },
      'LWB': { top: '10%', left: '30%' },
      'DM': { top: '48%', left: '30%' },
      'RWB': { top: '85%', left: '30%' },
      'LM': { top: '10%', left: '49%' },
      'CM': { top: '48%', left: '49%' },
      'RM': { top: '85%', left: '49%' },
      'AMR': { top: '10%', left: '67%' },
      'AM': { top: '48%', left: '67%' },
      'AML': { top: '85%', left: '67%' },
      'LW': { top: '10%', left: '83%' },
      'CF': { top: '48%', left: '83%' },
      'RW': { top: '85%', left: '83%' },
      'ST': { top: '48%', left: '95%' }
    };

    return positionMap[position.id] || { top: '48%', left: '50%' };
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Team Name */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{teamName}</h3>
        <div className="text-gray-400 text-sm mt-2">Formation: {formation}</div>
      </div>

      {/* CSS-based pitch layout */}
      <div className="relative mx-auto" style={{ width: '90%', maxWidth: '800px' }}>
        <div
          className="relative"
          style={{
            display: 'inline-block',
            verticalAlign: 'middle',
            width: '100%',
            height: 0,
            margin: '10px auto',
            padding: '0 0 60% 0',
            backgroundColor: '#17191F',
            borderRadius: '5px',
          }}
        >
          {/* Pitch borders and markings */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: '100%',
              margin: 'auto',
              border: '1px solid #323642',
            }}
          />
          
          {/* Center line */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              left: '50%',
              display: 'block',
              width: 0,
              height: '100%',
              marginLeft: '.5px',
              border: '0.5px solid #323642',
            }}
          />
          

          {/* Left penalty area */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '1px',
              margin: '-16% 0 0 -1px',
              display: 'block',
              width: '16%',
              height: '55%',
              backgroundColor: '#17191F',
              border: '1px solid #323642',
            }}
          />

          {/* Left goal area */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '1px',
              margin: '-8% 0 0 -1px',
              display: 'block',
              width: '8%',
              height: '30%',
              border: '1px solid #323642',
              zIndex: 2,
            }}
          />

          {/* Right penalty area */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              right: 0,
              margin: '-16% -1px 0 0',
              display: 'block',
              width: '16%',
              height: '55%',
              backgroundColor: '#17191F',
              border: '1px solid #323642',
            }}
          />

          {/* Right goal area */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              right: '-2px',
              margin: '-8% 0 0 -1px',
              display: 'block',
              width: '8%',
              height: '30%',
              border: '1px solid #323642',
              zIndex: 2,
            }}
          />

          {/* Left penalty arc */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '5%',
              width: '16%',
              height: 0,
              margin: '-8% 0 0 0',
              paddingBottom: '16%',
              border: '1px solid #323642',
              borderRadius: '50%',
            }}
          />

          {/* Right penalty arc */}
          <div
            style={{
              content: '""',
              position: 'absolute',
              top: '50%',
              right: '5%',
              width: '16%',
              height: 0,
              margin: '-8% 0 0 0',
              paddingBottom: '16%',
              border: '1px solid #323642',
              borderRadius: '50%',
            }}
          />

          {/* Players */}
          {formationData.positions.map((position) => {
            const playerId = lineup[position.id];
            const player = playerId ? getPlayerById(playerId) : null;
            const positionStyle = getPositionStyle(position);

            return (
              <div
                key={position.id}
                style={{
                  position: 'absolute',
                  top: positionStyle.top,
                  left: positionStyle.left,
                  display: 'block',
                  width: '3%',
                  height: '5%',
                  backgroundColor: player ? '#4F7EDC' : '#666',
                  border: `1px solid ${player ? '#324978' : '#444'}`,
                  zIndex: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                className="hover:scale-125"
                title={player ? `${player.firstName} ${player.lastName} (#${player.jerseyNumber})` : position.label}
              />
            );
          })}
        </div>
      </div>

      {/* Player list below pitch */}
      <div className="mt-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {formationData.positions.map((position) => {
            const playerId = lineup[position.id];
            const player = playerId ? getPlayerById(playerId) : null;
            
            return (
              <div key={position.id} className="flex items-center space-x-3 p-2 bg-gray-800 rounded-lg">
                <div
                  className="w-4 h-4 flex-shrink-0"
                  style={{
                    backgroundColor: player ? '#4F7EDC' : '#666',
                    border: `1px solid ${player ? '#324978' : '#444'}`,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">{position.label}</div>
                  <div className="text-sm text-white truncate">
                    {player ? `${player.firstName} ${player.lastName}` : 'No player'}
                  </div>
                  {player && (
                    <div className="text-xs text-gray-400">#{player.jerseyNumber}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="text-gray-400 text-sm">{formation} Formation</div>
      </div>
    </div>
  );
}