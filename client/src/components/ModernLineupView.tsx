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

  const getPositionColor = (_role: string) => 'bg-gray-600';

  // ==== NEW: normalize the coordinates so they fill the half pitch nicely ====
  const xs = formationData.positions.map(p => p.x);
  const ys = formationData.positions.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const norm = (v: number, min: number, max: number) =>
    max === min ? 0.5 : (v - min) / (max - min);

  // padding around the drawing area (in % of the box)
  const PAD_X = 18; // left/right padding (increased to prevent touching edges)
  const PAD_Y = 15; // top/bottom padding (increased to prevent touching edges)
  const SPAN_X = 100 - PAD_X * 2; // usable width inside padding
  const SPAN_Y = 100 - PAD_Y * 2; // usable height inside padding
  // ==========================================================================

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Team Name */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white">{teamName}</h3>
        <div className="text-gray-400 text-sm mt-2">Formation: {formation}</div>
      </div>

      {/* Make the pitch responsive: keep the aspect similar to 600x650 */}
      <div className="relative mx-auto w-full max-w-[700px]">
        <div
          className="relative bg-green-800 rounded-lg overflow-hidden"
          style={{
            // Aspect ~ 12:13 so it scales but stays proportional
            paddingTop: '108%', // (13/12)*100 ≈ 108%
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
          {/* Pitch Markings */}
          <div className="absolute inset-6">
            <div className="absolute inset-0 border-l-2 border-t-2 border-b-2 border-white rounded-l-lg"></div>
            <div className="absolute right-0 top-0 bottom-0 w-0.5 bg-white"></div>
            <div
              className="absolute right-0 top-1/2 w-32 h-32 border-2 border-white rounded-l-full transform -translate-y-1/2"
              style={{ borderRight: 'none' }}
            />
            <div className="absolute right-0 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-y-1/2" />
            <div className="absolute left-0 top-1/2 w-20 h-24 border-2 border-white border-l-0 transform -translate-y-1/2" />
            <div className="absolute left-0 top-1/2 w-12 h-16 border-2 border-white border-l-0 transform -translate-y-1/2" />
            <div className="absolute left-0 top-1/2 w-1 h-12 bg-white transform -translate-y-1/2" />
            <div className="absolute left-0 top-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-full" />
            <div className="absolute left-0 bottom-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-full" />
          </div>

          {/* Players */}
          {formationData.positions.map((position) => {
            const playerId = lineup[position.id];
            const player = playerId ? getPlayerById(playerId) : null;
            const colorClass = getPositionColor(position.role);

            // ==== NEW: correct axis + normalized spread (horizontal orientation) ====
            let leftPct = PAD_X + norm(position.y, minY, maxY) * SPAN_X; // Y controls left (depth becomes width)
            let topPct  = PAD_Y + norm(position.x, minX, maxX) * SPAN_Y;  // X controls top (width becomes height)
            
            // Special adjustment for center backs to bring them closer together
            if (position.id === 'CB1' || position.id === 'CB2') {
              const centerY = PAD_Y + 0.5 * SPAN_Y; // center line
              topPct = centerY + (topPct - centerY) * 0.6; // bring 40% closer to center
            }
            // =================================================

            return (
              <div
                key={position.id}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                {player ? (
                  <div className="flex flex-col items-center">
                    <div className={`relative w-12 h-14 md:w-16 md:h-20 ${colorClass} rounded-lg shadow-lg border-2 border-white flex items-center justify-center hover:scale-110 transition-transform mb-1 md:mb-2`}>
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white/60 rounded" />
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-3 h-2 border-2 border-white/40 rounded-t" />
                      <div className="text-white font-bold text-base md:text-lg">
                        {player.jerseyNumber}
                      </div>
                    </div>
                    <div className="text-center min-w-[70px] md:min-w-[80px]">
                      <div className="text-white font-semibold text-xs md:text-sm leading-tight">
                        {player.firstName}
                      </div>
                      <div className="text-white font-semibold text-xs md:text-sm leading-tight">
                        {player.lastName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="relative w-12 h-14 md:w-16 md:h-20 bg-gray-700 rounded-lg shadow-lg border-2 border-white/30 flex items-center justify-center opacity-50 mb-1 md:mb-2">
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-white/30 rounded" />
                      <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-3 h-2 border-2 border-white/20 rounded-t" />
                      <div className="text-white/60 font-bold text-xs">?</div>
                    </div>
                    <div className="text-gray-400 text-[10px] md:text-xs text-center min-w-[70px] md:min-w-[80px]">
                      {position.label}
                    </div>
                  </div>
                )}
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