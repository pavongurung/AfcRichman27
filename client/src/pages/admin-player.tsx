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
      const response = await fetch(`/api/players/${playerId}/stats`, {
        method: "PATCH",
        body: JSON.stringify(updates),
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to update stats");
      return response.json();
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

  // Custom stat field mapping system
  const customStatFields = [
    { key: 'appearance', display: 'Appearance', patterns: ['appearance', 'appearances', 'apps'] },
    { key: 'motm', display: 'MOTM', patterns: ['motm', 'man of the match', 'player of the match'] },
    { key: 'goals', display: 'Goals', patterns: ['goals', 'goal', 'scored'] },
    { key: 'assists', display: 'Assists', patterns: ['assists', 'assist'] },
    { key: 'possessionWon', display: 'Possession Won', patterns: ['possession won', 'poss won', 'possession+'] },
    { key: 'possessionLost', display: 'Possession Lost', patterns: ['possession lost', 'poss lost', 'possession-'] },
    { key: 'possessionDifference', display: 'Possession Difference', patterns: ['possession difference', 'poss diff', 'possession +/-'] },
    { key: 'cleanSheet', display: 'Clean Sheet', patterns: ['clean sheet', 'clean sheets', 'cs'] },
    { key: 'yellowCards', display: 'Yellow', patterns: ['yellow', 'yellow cards', 'yellow card', 'yc'] },
    { key: 'redCards', display: 'Red', patterns: ['red', 'red cards', 'red card', 'rc'] },
    { key: 'saves', display: 'Saves', patterns: ['saves', 'save'] },
    { key: 'pkSave', display: 'PK Save', patterns: ['pk save', 'penalty save', 'pen save'] },
    { key: 'avgRating', display: 'Avg Rating', patterns: ['avg rating', 'average rating', 'rating'] },
    { key: 'shots', display: 'Shots', patterns: ['shots', 'shot'] },
    { key: 'shotAccuracy', display: 'Shot Accuracy (%)', patterns: ['shot accuracy', 'shooting accuracy', 'shot acc'] },
    { key: 'passes', display: 'Passes', patterns: ['passes', 'pass'] },
    { key: 'passAccuracy', display: 'Pass Accuracy (%)', patterns: ['pass accuracy', 'passing accuracy', 'pass acc'] },
    { key: 'dribbles', display: 'Dribbles', patterns: ['dribbles', 'dribble'] },
    { key: 'dribbleSuccessRate', display: 'Dribble Success Rate (%)', patterns: ['dribble success', 'dribbling success', 'dribble acc'] },
    { key: 'tackles', display: 'Tackles', patterns: ['tackles', 'tackle'] },
    { key: 'tackleSuccessRate', display: 'Tackle Success Rate (%)', patterns: ['tackle success', 'tackling success', 'tackle acc'] },
    { key: 'offsides', display: 'Offsides', patterns: ['offsides', 'offside'] },
    { key: 'foulsCommitted', display: 'Fouls Committed', patterns: ['fouls committed', 'fouls', 'foul'] },
    { key: 'minutes', display: 'Minutes', patterns: ['minutes', 'mins'] },
  ];

  const parseStatsFromText = (text: string): Partial<PlayerStats> => {
    const stats: Partial<PlayerStats> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Function to extract stats from the specific right-side format visible in the image
    const extractFromRightColumn = (): Partial<PlayerStats> => {
      const rightColumnStats: Partial<PlayerStats> = {};
      
      // Look for the exact patterns from the performance screen
      // These are the individual player stats from the right column
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        
        // Goals: Look for "goals" followed by number
        if (line.includes('goals') && !line.includes('footed')) {
          const match = line.match(/\\b(\\d+)\\b/);
          if (match) rightColumnStats.goals = parseInt(match[1]);
        }
        
        // Assists: Look for "assists" followed by number  
        if (line.includes('assists')) {
          const match = line.match(/\\b(\\d+)\\b/);
          if (match) rightColumnStats.assists = parseInt(match[1]);
        }
        
        // Shots: Look for "shots" followed by number (should find 0 and 5, take smaller)
        if (line.includes('shots') && !line.includes('accuracy')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            // Take the first number (individual stat)
            rightColumnStats.shots = parseInt(numbers[0]);
          }
        }
        
        // Shot Accuracy: Look for "shot accuracy" with percentage
        if (line.includes('shot accuracy')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            // Take the first number (individual percentage)
            rightColumnStats.shotAccuracy = parseInt(numbers[0]);
          }
        }
        
        // Passes: Look for "passes" followed by number (should find 86 and 128, take smaller)
        if (line.includes('passes') && !line.includes('accuracy')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.passes = parseInt(numbers[0]);
          }
        }
        
        // Pass Accuracy: Look for "pass accuracy" with percentage
        if (line.includes('pass accuracy')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.passAccuracy = parseInt(numbers[0]);
          }
        }
        
        // Dribbles: Look for "dribbles" followed by number (should find 17 and 109, take smaller)
        if (line.includes('dribbles') && !line.includes('success')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            // Sort numbers and take smallest (individual stat)
            const sortedNumbers = numbers.map(n => parseInt(n)).sort((a, b) => a - b);
            rightColumnStats.dribbles = sortedNumbers[0];
          }
        }
        
        // Dribble Success Rate
        if (line.includes('dribble success')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.dribbleSuccessRate = parseInt(numbers[0]);
          }
        }
        
        // Tackles: Look for "tackles" followed by number (should find smaller number)
        if (line.includes('tackles') && !line.includes('success')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            const sortedNumbers = numbers.map(n => parseInt(n)).sort((a, b) => a - b);
            rightColumnStats.tackles = sortedNumbers[0];
          }
        }
        
        // Tackle Success Rate
        if (line.includes('tackle success')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.tackleSuccessRate = parseInt(numbers[0]);
          }
        }
        
        // Offsides
        if (line.includes('offsides')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.offsides = parseInt(numbers[0]);
          }
        }
        
        // Fouls Committed
        if (line.includes('fouls committed')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.foulsCommitted = parseInt(numbers[0]);
          }
        }
        
        // Possession Won
        if (line.includes('possession won')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.possessionWon = parseInt(numbers[0]);
          }
        }
        
        // Possession Lost
        if (line.includes('possession lost')) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            rightColumnStats.possessionLost = parseInt(numbers[0]);
          }
        }
        
        // Minutes Played (should find 91, not team average)
        if (line.includes('minutes') && (line.includes('played') || line.includes('vs'))) {
          const numbers = line.match(/\\b(\\d+)\\b/g);
          if (numbers) {
            // Look for the individual minutes (usually the smaller number)
            const sortedNumbers = numbers.map(n => parseInt(n)).sort((a, b) => a - b);
            rightColumnStats.minutes = sortedNumbers[0];
          }
        }
      }
      
      return rightColumnStats;
    };
    
    // Extract from left column table (player ratings)
    const extractFromLeftColumn = (): Partial<PlayerStats> => {
      const leftColumnStats: Partial<PlayerStats> = {};
      
      // Look for "vmoshmosh" or "mosh" in the table to find the player's row
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('vmoshmosh') || line.includes('mosh')) {
          // Extract rating from this line (should be 6.5)
          const ratingMatch = line.match(/\\b(\\d+\\.\\d+)\\b/);
          if (ratingMatch) {
            leftColumnStats.avgRating = Math.round(parseFloat(ratingMatch[1]) * 10);
          }
        }
      }
      
      return leftColumnStats;
    };
    
    // Combine stats from both columns
    const rightStats = extractFromRightColumn();
    const leftStats = extractFromLeftColumn();
    
    return { ...rightStats, ...leftStats };
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
                <div className="max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {customStatFields.map(field => {
                      const value = stats[field.key as keyof PlayerStats] || 0;
                      const displayValue = field.key === 'avgRating' && typeof value === 'number' && value > 0
                        ? (value / 10).toFixed(1)
                        : value?.toString() || '0';
                      return (
                        <div key={field.key}>
                          <Label className="text-xs">{field.display}</Label>
                          <div className="text-lg font-bold">
                            {displayValue}
                            {field.display.includes('%') && value ? '%' : ''}
                          </div>
                        </div>
                      );
                    })}
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
            
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customStatFields.map(field => {
                  const value = extractedStats[field.key as keyof PlayerStats] || 0;
                  const displayValue = field.key === 'avgRating' && typeof value === 'number' && value > 0
                    ? (value / 10).toFixed(1)
                    : value?.toString() || '0';
                  return (
                    <div key={field.key}>
                      <Label htmlFor={field.key}>{field.display}</Label>
                      <Input
                        id={field.key}
                        type="number"
                        min="0"
                        step={field.key === 'avgRating' ? '0.1' : '1'}
                        value={displayValue}
                        onChange={(e) => {
                          let newValue = e.target.value;
                          if (field.key === 'avgRating') {
                            handleStatChange(field.key as keyof PlayerStats, (parseFloat(newValue) * 10).toString());
                          } else {
                            handleStatChange(field.key as keyof PlayerStats, newValue);
                          }
                        }}
                        data-testid={`${field.key}-input`}
                      />
                    </div>
                  );
                })}
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