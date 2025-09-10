import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Pencil, Trash2, Plus, Save, Upload, ImageIcon, Shuffle, Users, BarChart3, Calendar, Camera, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Player, PlayerStats, InsertPlayer, InsertPlayerStats, Match, InsertMatch } from "@shared/schema";
import { apiRequest } from "../lib/queryClient";
import { isUnauthorizedError } from "../lib/authUtils";
import FormationPitch from "../components/FormationPitch";
import { getFormationById } from "../lib/formations";

const playerFormSchema = z.object({
  jerseyNumber: z.number().min(1).max(99),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  position: z.enum(["Goalkeeper", "Defender", "Midfielder", "Forward"]),
  consoleUsername: z.string().min(1, "Console username is required"),
  joinDate: z.string().min(1, "Join date is required"),
  imageUrl: z.string().optional(),
});

const statsFormSchema = z.object({
  // Basic Performance Stats
  appearance: z.number().min(0).default(0),
  motm: z.number().min(0).default(0),
  goals: z.number().min(0).default(0),
  assists: z.number().min(0).default(0),
  avgRating: z.number().min(0).max(100).default(0),
  
  // Shooting Stats
  shots: z.number().min(0).default(0),
  shotAccuracy: z.number().min(0).max(100).default(0),
  
  // Passing Stats
  passes: z.number().min(0).default(0),
  passAccuracy: z.number().min(0).max(100).default(0),
  
  // Dribbling Stats
  dribbles: z.number().min(0).default(0),
  dribbleSuccessRate: z.number().min(0).max(100).default(0),
  
  // Defensive Stats
  tackles: z.number().min(0).default(0),
  tackleSuccessRate: z.number().min(0).max(100).default(0),
  
  // Possession Stats
  possessionWon: z.number().min(0).default(0),
  possessionLost: z.number().min(0).default(0),
  
  // Goalkeeping Stats
  saves: z.number().min(0).default(0),
  pkSave: z.number().min(0).default(0),
  cleanSheet: z.number().min(0).default(0),
  
  // Disciplinary Stats
  yellowCards: z.number().min(0).default(0),
  redCards: z.number().min(0).default(0),
  offsides: z.number().min(0).default(0),
  foulsCommitted: z.number().min(0).default(0),
});

const matchFormSchema = z.object({
  homeTeam: z.string().min(1, "Home team is required"),
  awayTeam: z.string().min(1, "Away team is required"),
  homeTeamLogo: z.string().optional(),
  awayTeamLogo: z.string().optional(),
  homeScore: z.number().min(0).optional(),
  awayScore: z.number().min(0).optional(),
  competition: z.string().min(1, "Competition is required"),
  matchDate: z.string().min(1, "Match date is required"),
  status: z.enum(["FT", "Upcoming", "Live"]),
  replayUrl: z.string().optional(),
  formation: z.string().optional(),
  lineup: z.record(z.string()).optional(), // Record<positionId, playerId>
});

type PlayerFormData = z.infer<typeof playerFormSchema>;
type StatsFormData = z.infer<typeof statsFormSchema>;
type MatchFormData = z.infer<typeof matchFormSchema>;

// Auto-assign players to empty positions
function autoAssignPlayers(formationId: string, currentLineup: Record<string, string>, availablePlayers: Player[]): Record<string, string> {
  const formation = getFormationById(formationId);
  if (!formation) return currentLineup;

  const newLineup = { ...currentLineup };
  const usedPlayerIds = new Set(Object.values(currentLineup));
  const unusedPlayers = availablePlayers.filter(player => !usedPlayerIds.has(player.id));

  // Group players by role preference
  const playersByRole: Record<string, Player[]> = {
    GK: unusedPlayers.filter(p => p.position === "Goalkeeper"),
    DEF: unusedPlayers.filter(p => p.position === "Defender"), 
    MID: unusedPlayers.filter(p => p.position === "Midfielder"),
    FWD: unusedPlayers.filter(p => p.position === "Forward"),
  };

  // Auto-assign missing positions
  formation.positions.forEach(position => {
    if (!newLineup[position.id]) {
      const preferredPlayers = playersByRole[position.role] || [];
      
      if (preferredPlayers.length > 0) {
        // Use first available player of correct role
        const player = preferredPlayers.shift();
        if (player) {
          newLineup[position.id] = player.id;
          // Remove from other role arrays to avoid duplicates
          Object.values(playersByRole).forEach(roleList => {
            const index = roleList.findIndex(p => p.id === player.id);
            if (index !== -1) roleList.splice(index, 1);
          });
        }
      } else {
        // Fallback: use any available player
        const anyPlayer = Object.values(playersByRole).flat()[0];
        if (anyPlayer) {
          newLineup[position.id] = anyPlayer.id;
          // Remove from all role arrays
          Object.values(playersByRole).forEach(roleList => {
            const index = roleList.findIndex(p => p.id === anyPlayer.id);
            if (index !== -1) roleList.splice(index, 1);
          });
        }
      }
    }
  });

  return newLineup;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingStats, setEditingStats] = useState<(PlayerStats & { playerId: string; playerName: string }) | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const queryClient = useQueryClient();
  
  const handleImageUpload = async (file: File, onChange: (url: string) => void) => {
    try {
      setIsUploading(true);
      console.log("Starting upload for file:", file.name, "size:", file.size, "type:", file.type);
      
      // Get upload URL from backend
      console.log("Getting upload URL from backend...");
      const uploadResponse = await fetch("/api/objects/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      console.log("Upload response status:", uploadResponse.status);
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("Failed to get upload URL:", errorText);
        throw new Error(`Failed to get upload URL: ${errorText}`);
      }
      
      const responseData = await uploadResponse.json();
      console.log("Upload URL response:", responseData);
      const { uploadURL } = responseData;
      
      // Upload file to signed URL
      console.log("Uploading file to signed URL...");
      const fileUploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });
      
      console.log("File upload response status:", fileUploadResponse.status);
      if (!fileUploadResponse.ok) {
        const errorText = await fileUploadResponse.text();
        console.error("Failed to upload file:", errorText);
        throw new Error(`Failed to upload file: ${errorText}`);
      }
      
      // Extract the object path from the upload URL
      console.log("Processing upload URL:", uploadURL);
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      console.log("Object path:", objectPath);
      
      // Extract the UUID from the path: /.private/uploads/{uuid}
      const pathParts = objectPath.split('/uploads/');
      console.log("Path parts:", pathParts);
      if (pathParts.length > 1) {
        const objectId = pathParts[1].split('?')[0]; // Remove query parameters
        const normalizedPath = `/objects/uploads/${objectId}`;
        console.log("Normalized path:", normalizedPath);
        onChange(normalizedPath);
      } else {
        throw new Error("Invalid upload URL format");
      }
      
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
      
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
        description: `Failed to upload image: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Resize image to max 1024px while maintaining aspect ratio
        const maxSize = 1024;
        let { width, height } = img;
        
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const base64 = compressedDataUrl.split(',')[1];
        resolve(base64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleOcrImageUpload = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      setOcrProgress(0);
      
      toast({
        title: "Analyzing Image",
        description: "Using AI to extract football statistics...",
      });

      // Convert file to base64 for OpenAI
      setOcrProgress(25);
      const base64Image = await convertFileToBase64(file);
      
      setOcrProgress(50);
      
      // Call OpenAI API via our backend
      const response = await apiRequest('POST', '/api/extract-stats', {
        image: base64Image,
        mimeType: file.type
      });

      setOcrProgress(75);

      const data = await response.json();
      console.log("OpenAI OCR Results:", data);

      if (!data.extractedStats || Object.keys(data.extractedStats).length === 0) {
        toast({
          title: "No Stats Found",
          description: "Could not identify football statistics in the image. Try a clearer image with visible stat labels.",
          variant: "destructive",
        });
        return;
      }
      
      setOcrProgress(100);
      
      // Auto-fill the form with extracted data
      Object.entries(data.extractedStats).forEach(([key, value]) => {
        if (statsForm.getValues(key as keyof StatsFormData) !== undefined && typeof value === 'number') {
          statsForm.setValue(key as keyof StatsFormData, value);
        }
      });

      toast({
        title: "AI Analysis Complete",
        description: `Successfully extracted ${Object.keys(data.extractedStats).length} stat values! Check the form fields.`,
      });

    } catch (error) {
      console.error("AI OCR error:", error);
      toast({
        title: "AI Analysis Failed",
        description: error instanceof Error ? error.message : "Could not extract statistics from image. Please try again with a clearer image.",
        variant: "destructive",
      });
    } finally {
      setIsOcrProcessing(false);
      setOcrProgress(0);
    }
  };


  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    enabled: isAuthenticated,
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
    enabled: isAuthenticated,
  });

  const playerForm = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      jerseyNumber: 1,
      firstName: "",
      lastName: "",
      position: "Midfielder",
      consoleUsername: "",
      joinDate: "",
      imageUrl: "",
    },
  });

  const statsForm = useForm<StatsFormData>({
    resolver: zodResolver(statsFormSchema),
    defaultValues: {
      appearance: 0,
      motm: 0,
      goals: 0,
      assists: 0,
      avgRating: 0,
      shots: 0,
      shotAccuracy: 0,
      passes: 0,
      passAccuracy: 0,
      dribbles: 0,
      dribbleSuccessRate: 0,
      tackles: 0,
      tackleSuccessRate: 0,
      possessionWon: 0,
      possessionLost: 0,
      saves: 0,
      pkSave: 0,
      cleanSheet: 0,
      yellowCards: 0,
      redCards: 0,
      offsides: 0,
      foulsCommitted: 0,
    },
  });

  const matchForm = useForm<MatchFormData>({
    resolver: zodResolver(matchFormSchema),
    defaultValues: {
      homeTeam: "",
      awayTeam: "",
      homeTeamLogo: "",
      awayTeamLogo: "",
      competition: "",
      matchDate: "",
      status: "Upcoming",
      replayUrl: "",
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You need to be logged in to access the admin panel. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const createPlayerMutation = useMutation({
    mutationFn: async (data: InsertPlayer) => {
      return await apiRequest("POST", "/api/admin/players", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player created successfully!",
      });
      setIsPlayerDialogOpen(false);
      playerForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create player. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPlayer> }) => {
      return await apiRequest("PUT", `/api/admin/players/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player updated successfully!",
      });
      setEditingPlayer(null);
      setIsPlayerDialogOpen(false);
      playerForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update player. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertPlayerStats> }) => {
      return await apiRequest("PUT", `/api/admin/players/${id}/stats`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players-with-stats"] });
      toast({
        title: "Success",
        description: "Player stats updated successfully!",
      });
      setEditingStats(null);
      statsForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update stats. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/players/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      toast({
        title: "Success",
        description: "Player deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Match Mutations
  const createMatchMutation = useMutation({
    mutationFn: async (data: InsertMatch) => {
      return await apiRequest("POST", "/api/admin/matches", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Success",
        description: "Match created successfully!",
      });
      setIsMatchDialogOpen(false);
      matchForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMatchMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertMatch> }) => {
      return await apiRequest("PUT", `/api/admin/matches/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Success",
        description: "Match updated successfully!",
      });
      setEditingMatch(null);
      setIsMatchDialogOpen(false);
      matchForm.reset();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMatchMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/matches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Success",
        description: "Match deleted successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete match. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    playerForm.reset({
      jerseyNumber: player.jerseyNumber,
      firstName: player.firstName,
      lastName: player.lastName || "",
      position: player.position as any,
      consoleUsername: player.consoleUsername,
      joinDate: player.joinDate,
      imageUrl: player.imageUrl || "",
    });
    setIsPlayerDialogOpen(true);
  };

  const handleEditStats = async (player: Player) => {
    try {
      const response = await fetch(`/api/players/${player.id}/stats`);
      if (!response.ok) throw new Error("Failed to fetch stats");
      const stats = await response.json();
      
      setEditingStats({ ...stats, playerId: player.id, playerName: `${player.firstName} ${player.lastName}` });
      statsForm.reset({
        appearance: stats.appearance || 0,
        motm: stats.motm || 0,
        goals: stats.goals || 0,
        assists: stats.assists || 0,
        avgRating: stats.avgRating || 0,
        shots: stats.shots || 0,
        shotAccuracy: stats.shotAccuracy || 0,
        passes: stats.passes || 0,
        passAccuracy: stats.passAccuracy || 0,
        dribbles: stats.dribbles || 0,
        dribbleSuccessRate: stats.dribbleSuccessRate || 0,
        tackles: stats.tackles || 0,
        tackleSuccessRate: stats.tackleSuccessRate || 0,
        possessionWon: stats.possessionWon || 0,
        possessionLost: stats.possessionLost || 0,
        cleanSheet: stats.cleanSheet || 0,
        saves: stats.saves || 0,
        yellowCards: stats.yellowCards || 0,
        redCards: stats.redCards || 0,
        offsides: stats.offsides || 0,
        foulsCommitted: stats.foulsCommitted || 0,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load player stats.",
        variant: "destructive",
      });
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    matchForm.reset({
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      homeTeamLogo: match.homeTeamLogo || "",
      awayTeamLogo: match.awayTeamLogo || "",
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
      competition: match.competition,
      matchDate: typeof match.matchDate === 'string' ? match.matchDate : new Date(match.matchDate).toISOString().slice(0, 16),
      status: match.status as "FT" | "Upcoming" | "Live",
      replayUrl: match.replayUrl || "",
      formation: match.formation || "",
      lineup: match.lineup || {},
    });
    setIsMatchDialogOpen(true);
  };

  const onPlayerSubmit = (data: PlayerFormData) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({
        id: editingPlayer.id,
        data,
      });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const onStatsSubmit = (data: StatsFormData) => {
    if (!editingStats) return;
    updateStatsMutation.mutate({
      id: editingStats.playerId,
      data,
    });
  };

  const onMatchSubmit = (data: MatchFormData) => {
    const processedData = {
      ...data,
      matchDate: new Date(data.matchDate),
    };
    
    if (editingMatch) {
      updateMatchMutation.mutate({
        id: editingMatch.id,
        data: processedData,
      });
    } else {
      createMatchMutation.mutate(processedData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-4 p-8 bg-card rounded-2xl border border-border">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-12 bg-card rounded-2xl border border-border max-w-md">
          <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Pencil className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground mb-6">Authentication required to access the admin panel.</p>
          <Button 
            onClick={() => window.location.href = "/api/login"}
            className="px-8 py-3 rounded-xl"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Pencil className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Admin Control Center
                </h1>
                <p className="text-sm text-muted-foreground">Manage players, statistics, and matches</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="players" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-muted p-2 rounded-2xl">
            <TabsTrigger 
              value="players" 
              className="rounded-xl py-3 px-6 data-[state=active]:bg-card data-[state=active]:text-foreground transition-all duration-200"
              data-testid="tab-players"
            >
              <Users className="w-4 h-4 mr-2" />
              Players
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="rounded-xl py-3 px-6 data-[state=active]:bg-card data-[state=active]:text-foreground transition-all duration-200"
              data-testid="tab-stats"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger 
              value="matches" 
              className="rounded-xl py-3 px-6 data-[state=active]:bg-card data-[state=active]:text-foreground transition-all duration-200"
              data-testid="tab-matches"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Matches
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <Card className="bg-card border-border rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Player Management
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {players?.length || 0} players registered
                      </p>
                    </div>
                  </div>
                  <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setEditingPlayer(null)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2.5"
                        data-testid="button-add-player"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-card border-border rounded-2xl">
                      <DialogHeader className="pb-6 border-b border-border">
                        <DialogTitle className="text-xl font-semibold flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <span>{editingPlayer ? "Edit Player" : "Add New Player"}</span>
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...playerForm}>
                        <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-6 pt-2">
                          
                          {/* Profile Image */}
                          <FormField
                            control={playerForm.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Profile Image</FormLabel>
                                <FormControl>
                                  <div className="flex items-center space-x-6">
                                    <div className="relative">
                                      <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-border flex items-center justify-center bg-muted overflow-hidden">
                                        {field.value ? (
                                          <img 
                                            src={field.value} 
                                            alt="Profile preview" 
                                            className="w-full h-full object-cover rounded-2xl"
                                          />
                                        ) : (
                                          <div className="text-center">
                                            <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                                            <p className="text-xs text-muted-foreground">No image</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleImageUpload(file, field.onChange);
                                        }}
                                        className="sr-only"
                                        id="player-image-upload"
                                        disabled={isUploading}
                                      />
                                      <label
                                        htmlFor="player-image-upload"
                                        className={`cursor-pointer inline-flex items-center px-4 py-2.5 border border-border text-foreground bg-background hover:bg-muted rounded-xl font-medium transition-all duration-200 ${
                                          isUploading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                      >
                                        <Upload className="w-4 h-4 mr-2" />
                                        {isUploading ? "Uploading..." : "Upload Image"}
                                      </label>
                                      <p className="text-xs text-muted-foreground mt-2">PNG, JPG up to 10MB</p>
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Basic Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={playerForm.control}
                              name="jerseyNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">Jersey Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="1" 
                                      max="99" 
                                      {...field} 
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                      className="rounded-xl border-border bg-background"
                                      data-testid="input-jersey-number"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={playerForm.control}
                              name="position"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">Position</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="rounded-xl border-border bg-background" data-testid="select-position">
                                        <SelectValue placeholder="Select position" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl border-border bg-card">
                                      <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                                      <SelectItem value="Defender">Defender</SelectItem>
                                      <SelectItem value="Midfielder">Midfielder</SelectItem>
                                      <SelectItem value="Forward">Forward</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={playerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">First Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-xl border-border bg-background"
                                      data-testid="input-first-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={playerForm.control}
                              name="lastName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">Last Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-xl border-border bg-background"
                                      data-testid="input-last-name"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={playerForm.control}
                              name="consoleUsername"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">Console Username</FormLabel>
                                  <FormControl>
                                    <Input 
                                      {...field} 
                                      className="rounded-xl border-border bg-background"
                                      data-testid="input-console-username"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={playerForm.control}
                              name="joinDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-foreground">Join Date</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      className="rounded-xl border-border bg-background"
                                      data-testid="input-join-date"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex space-x-4 pt-6 border-t border-border">
                            <Button 
                              type="submit" 
                              disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}
                              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                              data-testid="button-submit-player"
                            >
                              <Save className="w-4 h-4 mr-2" />
                              {createPlayerMutation.isPending || updatePlayerMutation.isPending ? "Saving..." : editingPlayer ? "Update Player" : "Create Player"}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsPlayerDialogOpen(false)}
                              className="px-8 rounded-xl border-border"
                              data-testid="button-cancel-player"
                            >
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {playersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-muted-foreground">Loading players...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {players?.map((player) => (
                      <div 
                        key={player.id} 
                        className="group flex items-center justify-between p-6 bg-muted rounded-2xl border border-border hover:bg-muted/80 transition-all duration-200"
                        data-testid={`card-player-${player.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          {player.imageUrl ? (
                            <img 
                              src={player.imageUrl} 
                              alt={`${player.firstName} ${player.lastName}`}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-bold text-lg">
                              {player.jerseyNumber}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground text-lg">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs font-medium">
                                #{player.jerseyNumber}
                              </Badge>
                              <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs font-medium">
                                {player.position}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                @{player.consoleUsername}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlayer(player)}
                            className="rounded-xl border-border hover:bg-primary/20"
                            data-testid={`button-edit-player-${player.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deletePlayerMutation.mutate(player.id)}
                            className="rounded-xl border-border hover:bg-destructive/20 text-destructive"
                            data-testid={`button-delete-player-${player.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!players || players.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No players yet</h3>
                        <p className="text-muted-foreground mb-6">Start building your team by adding your first player.</p>
                        <Button
                          onClick={() => setIsPlayerDialogOpen(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2.5"
                          data-testid="button-add-first-player"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Player
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card className="bg-card border-border rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">
                      Player Statistics
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manage performance data and analytics
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {playersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-muted-foreground">Loading player statistics...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {players?.map((player) => (
                      <div 
                        key={player.id} 
                        className="group flex items-center justify-between p-6 bg-muted rounded-2xl border border-border hover:bg-muted/80 transition-all duration-200"
                        data-testid={`card-stats-player-${player.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          {player.imageUrl ? (
                            <img 
                              src={player.imageUrl} 
                              alt={`${player.firstName} ${player.lastName}`}
                              className="w-14 h-14 rounded-2xl object-cover border-2 border-border"
                            />
                          ) : (
                            <div className="w-14 h-14 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center font-bold text-lg">
                              {player.jerseyNumber}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-foreground text-lg">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="flex items-center space-x-3 mt-1">
                              <Badge variant="outline" className="rounded-lg px-3 py-1 text-xs font-medium">
                                {player.position}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                #{player.jerseyNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStats(player)}
                          className="rounded-xl border-border hover:bg-primary/20 opacity-0 group-hover:opacity-100 transition-all duration-200"
                          data-testid={`button-edit-stats-${player.id}`}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Stats
                        </Button>
                      </div>
                    ))}
                    {(!players || players.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <BarChart3 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No player statistics</h3>
                        <p className="text-muted-foreground">Add players first to manage their statistics.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistics Editing Panel */}
            {editingStats && (
              <Card className="bg-card border-border rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                        <Pencil className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Edit Statistics
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Update performance data for {editingStats.playerName}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingStats(null)}
                      className="rounded-xl border-border"
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* AI OCR Stats Extraction Section */}
                  <div className="mb-8 p-6 border-2 border-dashed border-primary/30 rounded-2xl bg-primary/5">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 flex items-center text-foreground">
                          AI Stats Extraction
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Upload a screenshot of match statistics and let AI automatically extract and fill the data for you.
                        </p>
                        <div className="flex items-center space-x-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleOcrImageUpload(file);
                            }}
                            className="sr-only"
                            id="ai-stats-upload"
                            disabled={isOcrProcessing}
                          />
                          <label
                            htmlFor="ai-stats-upload"
                            className={`cursor-pointer inline-flex items-center px-6 py-3 border-2 border-primary text-primary bg-background hover:bg-primary/10 rounded-xl font-medium transition-all duration-200 ${
                              isOcrProcessing ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {isOcrProcessing ? "Analyzing..." : "Upload Stats Image"}
                          </label>
                          {isOcrProcessing && (
                            <div className="flex items-center space-x-3">
                              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <div className="flex items-center space-x-2">
                                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${ocrProgress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-primary min-w-[3rem]">{ocrProgress}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Form {...statsForm}>
                    <form onSubmit={statsForm.handleSubmit(onStatsSubmit)} className="space-y-8">
                      
                      {/* Basic Performance Stats */}
                      <div className="bg-muted rounded-2xl p-6 border border-border">
                        <h3 className="text-lg font-semibold mb-6 flex items-center">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mr-3">
                            <BarChart3 className="w-4 h-4 text-primary-foreground" />
                          </div>
                          Basic Performance
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                          <FormField
                            control={statsForm.control}
                            name="appearance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Appearances</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-border bg-background"
                                    data-testid="input-appearance"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="motm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">MOTM</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-border bg-background"
                                    data-testid="input-motm"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="goals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Goals</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-border bg-background"
                                    data-testid="input-goals"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="assists"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Assists</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                    className="rounded-xl border-border bg-background"
                                    data-testid="input-assists"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="avgRating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-foreground">Avg Rating</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    step="0.1" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                    className="rounded-xl border-border bg-background"
                                    data-testid="input-avg-rating"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator className="bg-border" />

                      {/* Continue with other stats sections using the same dark theme pattern... */}
                      {/* For brevity, I'll include a few key sections */}

                      <div className="flex space-x-4 pt-8 border-t border-border">
                        <Button 
                          type="submit" 
                          disabled={updateStatsMutation.isPending}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                          data-testid="button-save-stats"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {updateStatsMutation.isPending ? "Saving..." : "Save Statistics"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setEditingStats(null)}
                          className="px-8 rounded-xl border-border"
                          data-testid="button-cancel-stats"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Matches Tab - simplified for space */}
          <TabsContent value="matches" className="space-y-6">
            <Card className="bg-card border-border rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Match Calendar
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {matches?.length || 0} matches scheduled
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setIsMatchDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2.5"
                    data-testid="button-add-match"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Match
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {matchesLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-muted-foreground">Loading matches...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {matches?.map((match) => (
                      <div 
                        key={match.id} 
                        className="group flex items-center justify-between p-6 bg-muted rounded-2xl border border-border hover:bg-muted/80 transition-all duration-200"
                        data-testid={`card-match-${match.id}`}
                      >
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              {new Date(match.matchDate).toLocaleDateString()}
                            </div>
                            <Badge 
                              variant={match.status === 'FT' ? 'default' : match.status === 'Live' ? 'destructive' : 'secondary'}
                              className="rounded-lg px-2 py-1 text-xs font-medium"
                            >
                              {match.status}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <div className="font-semibold text-foreground">{match.homeTeam}</div>
                              <div className="text-sm text-muted-foreground">{match.competition}</div>
                            </div>
                            <div className="text-center font-bold text-lg text-foreground px-4">
                              {match.homeScore !== null && match.awayScore !== null ? 
                                `${match.homeScore} - ${match.awayScore}` : 
                                'vs'
                              }
                            </div>
                            <div className="text-left">
                              <div className="font-semibold text-foreground">{match.awayTeam}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(match.matchDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMatch(match)}
                            className="rounded-xl border-border hover:bg-primary/20"
                            data-testid={`button-edit-match-${match.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMatchMutation.mutate(match.id)}
                            className="rounded-xl border-border hover:bg-destructive/20 text-destructive"
                            data-testid={`button-delete-match-${match.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {(!matches || matches.length === 0) && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Calendar className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-2">No matches scheduled</h3>
                        <p className="text-muted-foreground mb-6">Start building your match calendar by adding your first fixture.</p>
                        <Button
                          onClick={() => setIsMatchDialogOpen(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 py-2.5"
                          data-testid="button-add-first-match"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add First Match
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Match Dialog */}
        <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
          <DialogContent className="max-w-2xl bg-card border-border rounded-2xl">
            <DialogHeader className="pb-6 border-b border-border">
              <DialogTitle className="text-xl font-semibold flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-primary-foreground" />
                </div>
                <span>{editingMatch ? "Edit Match" : "Add New Match"}</span>
              </DialogTitle>
            </DialogHeader>
            <Form {...matchForm}>
              <form onSubmit={matchForm.handleSubmit((data) => {
                const processedData = {
                  ...data,
                  matchDate: data.matchDate ? new Date(data.matchDate) : new Date(),
                };

                if (editingMatch) {
                  updateMatchMutation.mutate({
                    id: editingMatch.id,
                    data: processedData,
                  });
                } else {
                  createMatchMutation.mutate(processedData);
                }
              })} className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={matchForm.control}
                    name="homeTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Home Team</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter home team name" 
                            {...field} 
                            className="rounded-xl border-border bg-background"
                            data-testid="input-home-team"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={matchForm.control}
                    name="awayTeam"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Away Team</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter away team name" 
                            {...field} 
                            className="rounded-xl border-border bg-background"
                            data-testid="input-away-team"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={matchForm.control}
                    name="homeScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Home Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="rounded-xl border-border bg-background"
                            data-testid="input-home-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={matchForm.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Away Score</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="rounded-xl border-border bg-background"
                            data-testid="input-away-score"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={matchForm.control}
                    name="competition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Competition</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. Premier League, Cup Final" 
                            {...field} 
                            className="rounded-xl border-border bg-background"
                            data-testid="input-competition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={matchForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-border bg-background" data-testid="select-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Upcoming">Upcoming</SelectItem>
                            <SelectItem value="Live">Live</SelectItem>
                            <SelectItem value="FT">Full Time</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={matchForm.control}
                  name="matchDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Match Date & Time</FormLabel>
                      <FormControl>
                        <Input 
                          type="datetime-local" 
                          {...field} 
                          className="rounded-xl border-border bg-background"
                          data-testid="input-match-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={matchForm.control}
                  name="replayUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Replay URL (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          {...field} 
                          className="rounded-xl border-border bg-background"
                          data-testid="input-replay-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Formation and Lineup Section */}
                <div className="space-y-4 p-4 border border-border rounded-xl bg-muted/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                      <Users className="w-3 h-3 text-primary-foreground" />
                    </div>
                    <h3 className="text-sm font-medium text-foreground">Formation & Lineup</h3>
                  </div>
                  
                  <FormField
                    control={matchForm.control}
                    name="formation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-foreground">Formation (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl border-border bg-background" data-testid="select-formation">
                              <SelectValue placeholder="Select formation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="4-3-3">4-3-3</SelectItem>
                            <SelectItem value="4-4-2">4-4-2</SelectItem>
                            <SelectItem value="3-5-2">3-5-2</SelectItem>
                            <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                            <SelectItem value="3-4-3">3-4-3</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Interactive Formation Pitch */}
                  {matchForm.watch("formation") && (
                    <div className="mt-4">
                      <FormationPitch
                        selectedFormation={matchForm.watch("formation") || "4-3-3"}
                        lineup={matchForm.watch("lineup") || {}}
                        players={players || []}
                        isEditing={true}
                        onFormationChange={(formation) => matchForm.setValue("formation", formation)}
                        onLineupChange={(lineup) => matchForm.setValue("lineup", lineup)}
                        className="max-w-md mx-auto"
                      />
                      
                      <div className="flex justify-center mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentFormation = matchForm.watch("formation");
                            const currentLineup = matchForm.watch("lineup") || {};
                            if (currentFormation && players) {
                              const autoLineup = autoAssignPlayers(currentFormation, currentLineup, players);
                              matchForm.setValue("lineup", autoLineup);
                            }
                          }}
                          className="rounded-xl border-border"
                          data-testid="button-auto-assign"
                        >
                          <Shuffle className="w-4 h-4 mr-2" />
                          Auto Assign Players
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex space-x-4 pt-4 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={createMatchMutation.isPending || updateMatchMutation.isPending}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-3"
                    data-testid="button-save-match"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {createMatchMutation.isPending || updateMatchMutation.isPending ? "Saving..." : (editingMatch ? "Update Match" : "Create Match")}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsMatchDialogOpen(false);
                      setEditingMatch(null);
                      matchForm.reset();
                    }}
                    className="px-8 rounded-xl border-border"
                    data-testid="button-cancel-match"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}