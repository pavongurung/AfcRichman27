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


      <div className="mt-8 text-center">
        <div className="text-gray-400 text-sm">{formation} Formation</div>
      </div>
    </div>
  );
}