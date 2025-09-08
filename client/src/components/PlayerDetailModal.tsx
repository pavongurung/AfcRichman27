import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import type { Player, PlayerStats } from "@shared/schema";

interface PlayerDetailModalProps {
  playerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlayerDetailModal({ playerId, open, onOpenChange }: PlayerDetailModalProps) {
  const { data: player } = useQuery<Player>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error("Failed to fetch player");
      return response.json();
    },
    enabled: !!playerId && open,
  });

  const { data: stats } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch player stats");
      return response.json();
    },
    enabled: !!playerId && open,
  });

  const CircularProgress = ({ value, max, color, children }: { value: number; max: number; color: string; children: React.ReactNode }) => {
    const percentage = (value / max) * 100;
    const circumference = 2 * Math.PI * 14;
    const strokeDasharray = `${(percentage * circumference) / 100} ${circumference}`;

    return (
      <div className="text-center">
        <div className="relative w-24 h-24 mx-auto mb-2">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-muted-foreground"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray={strokeDasharray}
              className={color}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{value}</span>
          </div>
        </div>
        {children}
      </div>
    );
  };

  if (!player) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" data-testid="player-modal">
        <div className="relative">
          {/* Player hero image */}
          <div 
            className="h-96 bg-cover bg-center relative"
            style={{
              backgroundImage: `url('${player.imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800'}')`
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 bg-secondary/80 hover:bg-secondary"
              data-testid="close-modal-button"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="absolute bottom-8 left-8 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="bg-primary text-primary-foreground w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl">
                  {player.jerseyNumber}
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-gray-300">{player.position}</div>
                  <div className="text-4xl font-bold">
                    {player.firstName.toUpperCase()} {player.lastName.toUpperCase()}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-300">Nationality:</div>
                  <div className="font-semibold">{player.nationality}</div>
                </div>
                <div>
                  <div className="text-gray-300">Date of birth:</div>
                  <div className="font-semibold">{player.dateOfBirth}</div>
                </div>
                <div>
                  <div className="text-gray-300">Height:</div>
                  <div className="font-semibold">{player.height}</div>
                </div>
                <div>
                  <div className="text-gray-300">At AFC Richman since:</div>
                  <div className="font-semibold">{player.joinDate}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Statistics */}
          <div className="p-8">
            <h3 className="text-2xl font-bold mb-6">Statistics</h3>
            
            {stats && (
              <>
                {/* Performance circles */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
                  <CircularProgress value={stats.gamesPlayed} max={30} color="text-primary">
                    <div className="text-foreground font-semibold">Games played</div>
                  </CircularProgress>
                  
                  <CircularProgress value={stats.goals} max={25} color="text-green-500">
                    <div className="text-foreground font-semibold">Goals</div>
                  </CircularProgress>
                  
                  <CircularProgress value={stats.assists} max={20} color="text-blue-500">
                    <div className="text-foreground font-semibold">Assists</div>
                  </CircularProgress>
                  
                  <CircularProgress value={stats.yellowCards + stats.redCards} max={10} color="text-yellow-500">
                    <div className="text-foreground font-semibold">Cards</div>
                  </CircularProgress>
                </div>
                
                {/* Detailed stats table */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Starts</span>
                        <span className="font-semibold">{stats.starts}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Substitute on</span>
                        <span className="font-semibold">{stats.substituteOn}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Substitute off</span>
                        <span className="font-semibold">{stats.substituteOff}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time played</span>
                        <span className="font-semibold">{stats.minutes}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Goals & Assists</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Left-footed goals</span>
                        <span className="font-semibold">{stats.leftFootedGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Right-footed goals</span>
                        <span className="font-semibold">{stats.rightFootedGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Headed goals</span>
                        <span className="font-semibold">{stats.headedGoals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Assists</span>
                        <span className="font-semibold">{stats.assists}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
