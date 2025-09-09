import type { Player } from "@shared/schema";
import { getFormationById } from "@/lib/formations";
import { useState, useRef } from "react";

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

  // State for draggable positions
  const [draggedPositions, setDraggedPositions] = useState<Record<string, {x: number, y: number}>>({});
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const pitchRef = useRef<HTMLDivElement>(null);

  // Get position (either dragged or original)
  const getPosition = (position: any) => {
    const draggedPos = draggedPositions[position.id];
    if (draggedPos) {
      return draggedPos;
    }
    return { x: position.x, y: position.y };
  };

  // Handle drag start
  const handleDragStart = (positionId: string) => {
    setIsDragging(positionId);
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent, positionId: string, pitchRef: HTMLDivElement) => {
    if (isDragging !== positionId) return;

    const rect = pitchRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 140;

    // Constrain to pitch boundaries - allow full pitch movement
    const constrainedX = Math.max(2, Math.min(98, x));
    const constrainedY = Math.max(5, Math.min(135, y));

    setDraggedPositions(prev => ({
      ...prev,
      [positionId]: { x: constrainedX, y: constrainedY }
    }));
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(null);
  };

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
          <div 
            ref={pitchRef}
            className="campo"
            onMouseMove={(e) => {
              if (isDragging && pitchRef.current) {
                handleDragMove(e, isDragging, pitchRef.current);
              }
            }}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
          >
            <div className="semi1"></div>
            <div className="semi2"></div>
            <div className="divisoria"></div>
            <div className="interior"></div>
            <div className="penalty"></div>           
            {/* Only show positions that exist in the current formation */}
            {formationData.positions.map((position) => {
              const playerId = lineup[position.id];
              const player = playerId ? getPlayerById(playerId) : null;
              const currentPos = getPosition(position);
              
              // Convert formation coordinates to match the horizontal pitch layout
              // The pitch is displayed horizontally, so we need to rotate the coordinates
              // Formation y becomes CSS left (goal line to goal line = left to right)
              // Formation x becomes CSS top (sideline to sideline = top to bottom)
              const leftPercent = (currentPos.y / 140) * 100; // y: 10->7%, y: 75->54%
              const topPercent = currentPos.x; // x: 0-100 stays the same
              
              return (
                <div
                  key={position.id}
                  title={player ? `${player.firstName} ${player.lastName} (#${player.jerseyNumber})` : position.label}
                  style={{
                    position: 'absolute',
                    top: `${topPercent}%`,
                    left: `${leftPercent}%`,
                    display: 'block',
                    width: '3%',
                    height: '5%',
                    backgroundColor: player ? '#4F7EDC' : '#4F7EDC',
                    border: `1px solid ${player ? '#324978' : '#324978'}`,
                    borderRadius: '50%',
                    zIndex: isDragging === position.id ? 10 : 2,
                    cursor: isDragging === position.id ? 'grabbing' : 'grab',
                    transition: isDragging === position.id ? 'none' : 'all 0.2s ease',
                    transform: 'translate(-50%, -50%)',
                    opacity: isDragging === position.id ? 0.8 : 1,
                  }}
                  className="hover:scale-125 select-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleDragStart(position.id);
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