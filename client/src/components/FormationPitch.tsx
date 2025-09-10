import { useState } from 'react';
import { formations, getFormationById, getPositionColor, Position } from '../lib/formations';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { X, User } from 'lucide-react';
import type { Player } from '@shared/schema';

interface FormationPitchProps {
  selectedFormation?: string;
  lineup?: Record<string, string>; // positionId -> playerId
  players?: Player[];
  isEditing?: boolean;
  onFormationChange?: (formationId: string) => void;
  onLineupChange?: (lineup: Record<string, string>) => void;
  className?: string;
}

interface PlayerSelectDialogProps {
  position: Position;
  players: Player[];
  selectedPlayerId?: string;
  onSelect: (playerId: string | null) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function PlayerSelectDialog({ position, players, selectedPlayerId, onSelect, isOpen, onOpenChange }: PlayerSelectDialogProps) {
  const positionPlayers = players.filter(player => {
    // Filter players by position role
    const playerPosition = player.position.toLowerCase();
    switch (position.role) {
      case 'GK':
        return playerPosition.includes('goal');
      case 'DEF':
        return playerPosition.includes('def') || playerPosition.includes('back');
      case 'MID':
        return playerPosition.includes('mid');
      case 'FWD':
        return playerPosition.includes('forward') || playerPosition.includes('striker') || playerPosition.includes('wing');
      default:
        return true;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Player for {position.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              onSelect(null);
              onOpenChange(false);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Remove Player
          </Button>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {positionPlayers.map((player) => (
              <Button
                key={player.id}
                type="button"
                variant={selectedPlayerId === player.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  onSelect(player.id);
                  onOpenChange(false);
                }}
              >
                {player.imageUrl ? (
                  <img 
                    src={player.imageUrl} 
                    alt={`${player.firstName} ${player.lastName}`}
                    className="w-8 h-8 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-gray-300" />
                  </div>
                )}
                <div className="text-left">
                  <div className="font-medium">{player.firstName} {player.lastName}</div>
                  <div className="text-sm text-muted-foreground">#{player.jerseyNumber} • {player.position}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function FormationPitch({
  selectedFormation = '4-3-3',
  lineup = {},
  players = [],
  isEditing = false,
  onFormationChange,
  onLineupChange,
  className = ''
}: FormationPitchProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);

  const formation = getFormationById(selectedFormation);
  
  const getPlayerById = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const handlePositionClick = (position: Position) => {
    if (!isEditing) return;
    setSelectedPosition(position);
    setPlayerDialogOpen(true);
  };

  const handlePlayerSelect = (playerId: string | null) => {
    if (!selectedPosition || !onLineupChange) return;
    
    const newLineup = { ...lineup };
    if (playerId) {
      // Remove player from any other position first
      Object.keys(newLineup).forEach(pos => {
        if (newLineup[pos] === playerId) {
          delete newLineup[pos];
        }
      });
      newLineup[selectedPosition.id] = playerId;
    } else {
      delete newLineup[selectedPosition.id];
    }
    
    onLineupChange(newLineup);
  };

  if (!formation) {
    return <div>Formation not found</div>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Formation Selector */}
      {isEditing && onFormationChange && (
        <div className="flex items-center space-x-4">
          <label className="font-medium">Formation:</label>
          <Select value={selectedFormation} onValueChange={onFormationChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formations.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Football Pitch */}
      <div className="relative bg-green-600 rounded-lg p-4 mx-auto" style={{ width: '500px', height: '700px' }}>
        {/* Pitch markings */}
        <div className="absolute inset-4 border-2 border-white rounded">
          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 w-20 h-20 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* Center line */}
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-white transform -translate-y-1/2"></div>
          
          {/* Goal boxes */}
          <div className="absolute left-1/4 right-1/4 bottom-0 h-16 border-2 border-white border-b-0"></div>
          <div className="absolute left-1/3 right-1/3 bottom-0 h-8 border-2 border-white border-b-0"></div>
          
          <div className="absolute left-1/4 right-1/4 top-0 h-16 border-2 border-white border-t-0"></div>
          <div className="absolute left-1/3 right-1/3 top-0 h-8 border-2 border-white border-t-0"></div>
        </div>

        {/* Player Positions */}
        {formation.positions.map((position) => {
          const playerId = lineup[position.id];
          const player = playerId ? getPlayerById(playerId) : null;
          const colorClasses = getPositionColor(position.role);
          
          return (
            <button
              key={position.id}
              type="button"
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 flex flex-col items-center justify-center text-white text-xs font-bold transition-all ${colorClasses} ${
                isEditing ? 'hover:scale-110 cursor-pointer' : ''
              } ${player ? 'ring-2 ring-white' : ''}`}
              style={{
                left: `${(position.x / 100) * 100}%`,
                top: `${(position.y / 140) * 100}%`,
              }}
              onClick={() => handlePositionClick(position)}
              disabled={!isEditing}
              data-testid={`position-${position.id}`}
            >
              {player ? (
                <>
                  {player.imageUrl ? (
                    <img 
                      src={player.imageUrl} 
                      alt={`${player.firstName} ${player.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="text-[8px] text-center leading-tight">
                      <div>{player.firstName.slice(0, 1)}.{player.lastName.slice(0, 3)}</div>
                      <div>#{player.jerseyNumber}</div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-[8px]">{position.label}</div>
              )}
            </button>
          );
        })}

        {/* Player Selection Dialog */}
        {selectedPosition && (
          <PlayerSelectDialog
            position={selectedPosition}
            players={players}
            selectedPlayerId={lineup[selectedPosition.id]}
            onSelect={handlePlayerSelect}
            isOpen={playerDialogOpen}
            onOpenChange={setPlayerDialogOpen}
          />
        )}
      </div>

      {/* Formation Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Formation: {formation.name} • Players: {Object.keys(lineup).length}/11
      </div>
    </div>
  );
}