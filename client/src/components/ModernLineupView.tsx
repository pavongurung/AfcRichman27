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


  // Map formation position IDs to CSS class names
  const getPositionCSSClass = (positionId: string) => {
    const positionMap: Record<string, string> = {
      'GK': 'gk',
      'LB': 'lb',
      'CB1': 'cb',
      'CB2': 'cb', // Use same class for both center backs
      'RB': 'rb',
      'LWB': 'lwb',
      'DM': 'dm',
      'RWB': 'rwb',
      'LM': 'lm',
      'CM': 'cm',
      'CM1': 'cm',
      'CM2': 'cm', 
      'CM3': 'cm',
      'RM': 'rm',
      'AMR': 'amr',
      'AM': 'am',
      'AML': 'aml',
      'LW': 'wl',
      'CF': 'cf',
      'ST': 'st',
      'ST1': 'st',
      'ST2': 'cf', // Use cf for second striker
      'RW': 'wr'
    };
    return positionMap[positionId] || 'cm'; // Default to cm if not found
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">

      {/* New CSS-based pitch layout */}
      <div className="flex justify-center">
        <div className="campo-wrapper">
          <div className="campo">
            <div className="semi1"></div>
            <div className="semi2"></div>
            <div className="divisoria"></div>
            <div className="interior"></div>
            <div className="penalty"></div>           
            {/* Only show positions that exist in the current formation */}
            {formationData.positions.map((position) => {
              const playerId = lineup[position.id];
              const player = playerId ? getPlayerById(playerId) : null;
              
              // Convert formation coordinates to match the horizontal pitch layout
              // The pitch is displayed horizontally, so we need to rotate the coordinates
              // Formation y becomes CSS left (goal line to goal line = left to right)
              // Formation x becomes CSS top (sideline to sideline = top to bottom)
              // Map formation y (10-75) to left half of pitch (7% to 47%)
              const leftPercent = 7 + ((position.y - 10) / 65) * 40; // Maps y: 10->7%, y: 75->47%
              const topPercent = position.x; // x: 0-100 stays the same
              
              return (
                <div
                  key={position.id}
                  title={player ? `${player.firstName} ${player.lastName} (#${player.jerseyNumber})` : position.label}
                  style={{
                    position: 'absolute',
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="hover:scale-110 select-none transition-transform duration-200"
                >
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                      textAlign: 'center',
                      lineHeight: '1',
                      whiteSpace: 'nowrap',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.9)',
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                  >
                    {player ? player.lastName.toUpperCase() : 'AI'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>


    </div>
  );
}