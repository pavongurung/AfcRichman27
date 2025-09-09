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
            <div className="gk"></div>
            <div className="cb"></div>
            <div className="lb"></div>
            <div className="rb"></div>
            <div className="lwb"></div>
            <div className="dm"></div>
            <div className="rwb"></div>
            <div className="lm"></div>
            <div className="cm"></div>
            <div className="rm"></div>
            <div className="amr"></div>
            <div className="am"></div>
            <div className="aml"></div>
            <div className="wl"></div>
            <div className="cf"></div>
            <div className="wr"></div>
            <div className="st"></div>
          </div>
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