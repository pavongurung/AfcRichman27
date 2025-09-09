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
      {/* Team Name */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{teamName}</h3>
        <div className="text-gray-400 text-sm mt-2">Formation: {formation}</div>
      </div>

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
              const cssClass = getPositionCSSClass(position.id);
              
              return (
                <div
                  key={position.id}
                  className={cssClass}
                  title={player ? `${player.firstName} ${player.lastName} (#${player.jerseyNumber})` : position.label}
                  style={{
                    backgroundColor: player ? '#4F7EDC' : '#4F7EDC',
                    borderColor: player ? '#324978' : '#324978',
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>


      <div className="mt-8 text-center">
        <div className="text-gray-400 text-sm">{formation} Formation</div>
      </div>
    </div>
  );
}