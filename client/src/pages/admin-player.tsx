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

  // FC 25 Pro Clubs stat field mapping - matches exactly what appears in Player Performance screen
  const customStatFields = [
    { key: 'appearance', display: 'Appearance', patterns: ['appearance', 'appearances', 'apps'] },
    { key: 'motm', display: 'MOTM', patterns: ['motm', 'man of the match', 'player of the match'] },
    { key: 'goals', display: 'Goals', patterns: ['goals'] },
    { key: 'assists', display: 'Assists', patterns: ['assists'] },
    { key: 'shots', display: 'Shots', patterns: ['shots'] },
    { key: 'shotAccuracy', display: 'Shot Accuracy (%)', patterns: ['shot accuracy'] },
    { key: 'passes', display: 'Passes', patterns: ['passes'] },
    { key: 'passAccuracy', display: 'Pass Accuracy (%)', patterns: ['pass accuracy'] },
    { key: 'dribbles', display: 'Dribbles', patterns: ['dribbles'] },
    { key: 'dribbleSuccessRate', display: 'Dribble Success Rate (%)', patterns: ['dribble success rate'] },
    { key: 'tackles', display: 'Tackles', patterns: ['tackles'] },
    { key: 'tackleSuccessRate', display: 'Tackle Success Rate (%)', patterns: ['tackle success rate'] },
    { key: 'offsides', display: 'Offsides', patterns: ['offsides'] },
    { key: 'foulsCommitted', display: 'Fouls Committed', patterns: ['fouls committed'] },
    { key: 'possessionWon', display: 'Possession Won', patterns: ['possession won'] },
    { key: 'possessionLost', display: 'Possession Lost', patterns: ['possession lost'] },
    { key: 'minutesPlayed', display: 'Minutes Played', patterns: ['minutes played'] },
    { key: 'distanceCovered', display: 'Distance Covered (km)', patterns: ['distance covered'] },
    { key: 'distanceSprinted', display: 'Distance Sprinted (km)', patterns: ['distance sprinted'] },
    { key: 'saves', display: 'Saves', patterns: ['saves'] },
    { key: 'pkSave', display: 'PK Save', patterns: ['pk save'] },
    { key: 'cleanSheet', display: 'Clean Sheet', patterns: ['clean sheet'] },
    { key: 'yellowCards', display: 'Yellow', patterns: ['yellow'] },
    { key: 'redCards', display: 'Red', patterns: ['red'] },
    { key: 'avgRating', display: 'Avg Rating', patterns: ['avg rating', 'average rating', 'rating'] },
  ];

  const parseStatsFromText = (text: string): Partial<PlayerStats> => {
    const stats: Partial<PlayerStats> = {};
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    console.log('Extracting from text:', text);
    console.log('Lines:', lines);
    
    // Enhanced parsing for FC 25 Pro Clubs Player Performance screen
    // This screen shows stats in "Stat Name" followed by two columns: Individual | Team Average
    // We want only the FIRST column (individual player stats)
    
    const parseStatLine = (line: string, statName: string): number | null => {
      const lowerLine = line.toLowerCase();
      const lowerStatName = statName.toLowerCase();
      
      // Only process lines that start with the stat name or have it clearly positioned
      if (lowerLine.includes(lowerStatName)) {
        // Extract all numbers from the line
        const numbers = line.match(/\b(\d+(?:\.\d+)?)\b/g);
        if (numbers && numbers.length > 0) {
          console.log(`Processing "${statName}" from line: "${line}" -> found numbers: [${numbers.join(', ')}]`);
          
          // For FC 25 stats format: "Stat Name Individual TeamAverage"
          // We always want the FIRST number after the stat name
          if (lowerStatName === 'goals') {
            // "- hee i [7 Goals 0) 1" -> should be 0 (the number right after Goals)
            // Find "goals" position and get next number
            const goalsIndex = lowerLine.indexOf('goals');
            if (goalsIndex !== -1) {
              const afterGoals = line.substring(goalsIndex + 5);
              const nextNumbers = afterGoals.match(/\b(\d+)\b/g);
              if (nextNumbers) {
                console.log(`Goals: taking ${nextNumbers[0]} from "${afterGoals}"`);
                return parseInt(nextNumbers[0]);
              }
            }
          } else if (lowerStatName === 'assists') {
            return parseInt(numbers[0]);
          } else if (lowerStatName === 'shots') {
            // "Shots 0 5" - first number after "Shots"
            const shotsIndex = lowerLine.indexOf('shots');
            if (shotsIndex !== -1) {
              const afterShots = line.substring(shotsIndex + 5);
              const nextNumbers = afterShots.match(/\b(\d+)\b/g);
              if (nextNumbers) {
                console.log(`Shots: taking ${nextNumbers[0]} from "${afterShots}"`);
                return parseInt(nextNumbers[0]);
              }
            }
          } else if (lowerStatName.includes('accuracy') || lowerStatName.includes('success rate')) {
            // "Shot Accuracy (%) 0 80" - first number after the %
            if (lowerLine.includes('(%)')) {
              const percentIndex = line.indexOf('(%)');
              const afterPercent = line.substring(percentIndex + 3);
              const nextNumbers = afterPercent.match(/\b(\d+)\b/g);
              if (nextNumbers) {
                console.log(`Accuracy: taking ${nextNumbers[0]} from "${afterPercent}"`);
                return parseInt(nextNumbers[0]);
              }
            }
          }
          
          // Default: take first number
          return parseInt(numbers[0]);
        }
      }
      return null;
    };
    
    // Enhanced distance parsing for km values
    const parseDistanceLine = (line: string, statName: string): number | null => {
      const lowerLine = line.toLowerCase();
      const lowerStatName = statName.toLowerCase();
      
      if (lowerLine.includes(lowerStatName)) {
        // Look for decimal numbers (e.g., "17.2" for km)
        const decimalNumbers = line.match(/\b(\d+\.\d+)\b/g);
        if (decimalNumbers && decimalNumbers.length > 0) {
          // Convert km to meters for storage, take first value (individual)
          return Math.round(parseFloat(decimalNumbers[0]) * 1000);
        }
      }
      return null;
    };
    
    // Parse each line for all possible stats
    for (const line of lines) {
      // Basic stats
      let value = parseStatLine(line, 'goals');
      if (value !== null) stats.goals = value;
      
      value = parseStatLine(line, 'assists');
      if (value !== null) stats.assists = value;
      
      // Shooting stats  
      value = parseStatLine(line, 'shots');
      if (value !== null) stats.shots = value;
      
      value = parseStatLine(line, 'shot accuracy');
      if (value !== null) stats.shotAccuracy = value;
      
      // Passing stats - avoid pass accuracy line
      if (line.toLowerCase().includes('passes') && !line.toLowerCase().includes('pass accuracy')) {
        value = parseStatLine(line, 'passes');
        if (value !== null) stats.passes = value;
      }
      
      value = parseStatLine(line, 'pass accuracy');
      if (value !== null) stats.passAccuracy = value;
      
      // Dribbling stats - avoid success rate line
      if (line.toLowerCase().includes('dribbles') && !line.toLowerCase().includes('success')) {
        value = parseStatLine(line, 'dribbles');
        if (value !== null) stats.dribbles = value;
      }
      
      value = parseStatLine(line, 'dribble success rate');
      if (value !== null) stats.dribbleSuccessRate = value;
      
      // Defensive stats - avoid success rate line
      if (line.toLowerCase().includes('tackles') && !line.toLowerCase().includes('success')) {
        value = parseStatLine(line, 'tackles');
        if (value !== null) stats.tackles = value;
      }
      
      value = parseStatLine(line, 'tackle success rate');
      if (value !== null) stats.tackleSuccessRate = value;
      
      // Disciplinary stats
      value = parseStatLine(line, 'offsides');
      if (value !== null) stats.offsides = value;
      
      value = parseStatLine(line, 'fouls committed');
      if (value !== null) stats.foulsCommitted = value;
      
      // Possession stats
      value = parseStatLine(line, 'possession won');
      if (value !== null) stats.possessionWon = value;
      
      value = parseStatLine(line, 'possession lost');
      if (value !== null) stats.possessionLost = value;
      
      // Time stats
      value = parseStatLine(line, 'minutes played');
      if (value !== null) stats.minutesPlayed = value;
      
      // Distance stats (convert km to meters)
      value = parseDistanceLine(line, 'distance covered');
      if (value !== null) stats.distanceCovered = value;
      
      value = parseDistanceLine(line, 'distance sprinted');
      if (value !== null) stats.distanceSprinted = value;
      
      // Goalkeeping stats
      value = parseStatLine(line, 'saves');
      if (value !== null) stats.saves = value;
      
      value = parseStatLine(line, 'pk save');
      if (value !== null) stats.pkSave = value;
      
      value = parseStatLine(line, 'clean sheet');
      if (value !== null) stats.cleanSheet = value;
      
      // Card stats - be very specific to avoid wrong matches
      if (line.toLowerCase().includes('yellow') && !line.toLowerCase().includes('second') && !line.toLowerCase().includes('distance')) {
        value = parseStatLine(line, 'yellow');
        if (value !== null) stats.yellowCards = value;
      }
      
      if (line.toLowerCase().includes('red') && !line.toLowerCase().includes('covered') && !line.toLowerCase().includes('distance')) {
        value = parseStatLine(line, 'red');
        if (value !== null) stats.redCards = value;
      }
    }
    
    // Calculate derived stats
    if (stats.possessionWon !== undefined && stats.possessionLost !== undefined) {
      stats.possessionDifference = stats.possessionWon - stats.possessionLost;
    }
    
    console.log('Parsed stats:', stats);
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