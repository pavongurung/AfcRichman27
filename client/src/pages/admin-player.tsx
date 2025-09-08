import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ArrowLeft, Upload, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import Tesseract from 'tesseract.js';
import { apiRequest } from "@/lib/queryClient";
import type { Player, PlayerStats } from "@shared/schema";

export default function AdminPlayer() {
  const [, params] = useRoute("/admin/player/:id");
  const playerId = params?.id;
  const [isExtracting, setIsExtracting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [extractedStats, setExtractedStats] = useState<Partial<PlayerStats>>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: player, isLoading: playerLoading } = useQuery<Player>({
    queryKey: ["/api/players", playerId],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}`);
      if (!response.ok) throw new Error("Failed to fetch player");
      return response.json();
    },
    enabled: !!playerId,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<PlayerStats>({
    queryKey: ["/api/players", playerId, "stats"],
    queryFn: async () => {
      const response = await fetch(`/api/players/${playerId}/stats`);
      if (!response.ok) throw new Error("Failed to fetch player stats");
      return response.json();
    },
    enabled: !!playerId,
  });

  const updateStatsMutation = useMutation({
    mutationFn: async (updates: Partial<PlayerStats>) => {
      return apiRequest(`/api/players/${playerId}/stats`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players", playerId, "stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/players-with-stats"] });
      toast({ title: "Stats updated successfully!" });
      setShowConfirmDialog(false);
      setUploadedImage(null);
      setExtractedStats({});
    },
    onError: () => {
      toast({ title: "Failed to update stats", variant: "destructive" });
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show uploaded image
    const imageUrl = URL.createObjectURL(file);
    setUploadedImage(imageUrl);

    setIsExtracting(true);
    try {
      // Extract text from image using Tesseract
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });

      // Parse extracted text for stats
      const parsedStats = parseStatsFromText(text);
      setExtractedStats(parsedStats);
      setShowConfirmDialog(true);
    } catch (error) {
      console.error("Error extracting text:", error);
      toast({ title: "Failed to extract text from image", variant: "destructive" });
    } finally {
      setIsExtracting(false);
    }
  };

  const parseStatsFromText = (text: string): Partial<PlayerStats> => {
    const lines = text.toLowerCase().split('\n');
    const stats: Partial<PlayerStats> = {};

    for (const line of lines) {
      // Look for goals
      const goalMatch = line.match(/goals?\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*goals?/i);
      if (goalMatch) {
        stats.goals = parseInt(goalMatch[1]);
      }

      // Look for assists
      const assistMatch = line.match(/assists?\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*assists?/i);
      if (assistMatch) {
        stats.assists = parseInt(assistMatch[1]);
      }

      // Look for yellow cards
      const yellowMatch = line.match(/yellow\s*cards?\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*yellow/i);
      if (yellowMatch) {
        stats.yellowCards = parseInt(yellowMatch[1]);
      }

      // Look for red cards
      const redMatch = line.match(/red\s*cards?\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*red/i);
      if (redMatch) {
        stats.redCards = parseInt(redMatch[1]);
      }

      // Look for minutes
      const minutesMatch = line.match(/minutes?\s*:?\s*(\d+)/i) || line.match(/(\d+)\s*minutes?/i);
      if (minutesMatch) {
        stats.minutes = parseInt(minutesMatch[1]);
      }
    }

    return stats;
  };

  const handleConfirmStats = () => {
    updateStatsMutation.mutate(extractedStats);
  };

  const handleStatChange = (key: keyof PlayerStats, value: string) => {
    setExtractedStats(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  if (playerLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Player not found</h1>
          <Link href="/squad">
            <Button>Return to Squad</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-6">
          <Link href="/squad">
            <Button variant="ghost" size="icon" className="mr-4" data-testid="back-button">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">
            Admin: {player.firstName} {player.lastName}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Player Info */}
          <Card>
            <CardHeader>
              <CardTitle>Player Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-6">
                <div 
                  className="w-24 h-24 bg-cover bg-center rounded-full"
                  style={{
                    backgroundImage: `url('${player.imageUrl || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600'}')`
                  }}
                />
                <div>
                  <h3 className="text-xl font-bold">#{player.jerseyNumber} {player.firstName} {player.lastName}</h3>
                  <p className="text-muted-foreground">{player.position} • {player.nationality}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Current Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Games Played</Label>
                    <div className="text-2xl font-bold">{stats.gamesPlayed}</div>
                  </div>
                  <div>
                    <Label>Minutes</Label>
                    <div className="text-2xl font-bold">{stats.minutes}</div>
                  </div>
                  <div>
                    <Label>Goals</Label>
                    <div className="text-2xl font-bold text-green-500">{stats.goals}</div>
                  </div>
                  <div>
                    <Label>Assists</Label>
                    <div className="text-2xl font-bold text-blue-500">{stats.assists}</div>
                  </div>
                  <div>
                    <Label>Yellow Cards</Label>
                    <div className="text-2xl font-bold text-yellow-500">{stats.yellowCards}</div>
                  </div>
                  <div>
                    <Label>Red Cards</Label>
                    <div className="text-2xl font-bold text-red-500">{stats.redCards}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Post-Match Stats Image</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="image-upload-input"
                />
                
                {uploadedImage && (
                  <div className="relative">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded stats" 
                      className="max-w-full max-h-64 rounded-lg"
                    />
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setUploadedImage(null);
                        setExtractedStats({});
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExtracting}
                  className="w-full max-w-md"
                  data-testid="upload-button"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Extracting stats...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image to Upload
                    </>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Upload an image containing player statistics. The system will automatically detect and extract goals, assists, cards, and other stats.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="max-w-2xl" data-testid="confirm-dialog">
            <DialogHeader>
              <DialogTitle>Confirm Extracted Statistics</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="goals">Goals</Label>
                  <Input
                    id="goals"
                    type="number"
                    min="0"
                    value={extractedStats.goals || 0}
                    onChange={(e) => handleStatChange('goals', e.target.value)}
                    data-testid="goals-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="assists">Assists</Label>
                  <Input
                    id="assists"
                    type="number"
                    min="0"
                    value={extractedStats.assists || 0}
                    onChange={(e) => handleStatChange('assists', e.target.value)}
                    data-testid="assists-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="minutes">Minutes Played</Label>
                  <Input
                    id="minutes"
                    type="number"
                    min="0"
                    value={extractedStats.minutes || 0}
                    onChange={(e) => handleStatChange('minutes', e.target.value)}
                    data-testid="minutes-input"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="yellowCards">Yellow Cards</Label>
                  <Input
                    id="yellowCards"
                    type="number"
                    min="0"
                    value={extractedStats.yellowCards || 0}
                    onChange={(e) => handleStatChange('yellowCards', e.target.value)}
                    data-testid="yellow-cards-input"
                  />
                </div>
                
                <div>
                  <Label htmlFor="redCards">Red Cards</Label>
                  <Input
                    id="redCards"
                    type="number"
                    min="0"
                    value={extractedStats.redCards || 0}
                    onChange={(e) => handleStatChange('redCards', e.target.value)}
                    data-testid="red-cards-input"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStats}
                disabled={updateStatsMutation.isPending}
                data-testid="save-stats-button"
              >
                {updateStatsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Stats
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}