import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, Save, Upload, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Player, PlayerStats, InsertPlayer, InsertPlayerStats, Match, InsertMatch } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import FormationPitch from "@/components/FormationPitch";

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

export default function AdminPanel() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingStats, setEditingStats] = useState<PlayerStats | null>(null);
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
        window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
      return await apiRequest(`/api/admin/players/${id}/stats`, "PUT", data);
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
          window.location.href = "/api/login";
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
      return await apiRequest(`/api/admin/players/${id}`, "DELETE");
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
          window.location.href = "/api/login";
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
      
      setEditingStats(stats);
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

  const onPlayerSubmit = (data: PlayerFormData) => {
    if (editingPlayer) {
      updatePlayerMutation.mutate({ id: editingPlayer.id, data });
    } else {
      createPlayerMutation.mutate(data);
    }
  };

  const onStatsSubmit = (data: StatsFormData) => {
    if (editingStats) {
      updateStatsMutation.mutate({ id: editingStats.playerId, data });
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
      matchDate: new Date(match.matchDate).toISOString().slice(0, 16), // Format for datetime-local input
      status: match.status as "FT" | "Upcoming" | "Live",
      replayUrl: match.replayUrl || "",
    });
    setIsMatchDialogOpen(true);
  };

  const onMatchSubmit = (data: MatchFormData) => {
    // Convert the datetime-local string to ISO string for the API
    const matchData: any = {
      ...data,
      matchDate: data.matchDate, // Keep as string - server will handle conversion
      // Convert empty strings to null for optional fields
      homeTeamLogo: data.homeTeamLogo || null,
      awayTeamLogo: data.awayTeamLogo || null,
      replayUrl: data.replayUrl || null,
    };

    if (editingMatch) {
      updateMatchMutation.mutate({ id: editingMatch.id, data: matchData });
    } else {
      createMatchMutation.mutate(matchData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Control Panel</h1>
          <Button
            onClick={() => window.location.href = "/api/logout"}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="players">Player Management</TabsTrigger>
            <TabsTrigger value="stats">Statistics Management</TabsTrigger>
            <TabsTrigger value="matches">Match Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Players</CardTitle>
                  <Dialog open={isPlayerDialogOpen} onOpenChange={setIsPlayerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingPlayer(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Player
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>
                          {editingPlayer ? "Edit Player" : "Add New Player"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...playerForm}>
                        <form onSubmit={playerForm.handleSubmit(onPlayerSubmit)} className="space-y-4">
                          
                          <FormField
                            control={playerForm.control}
                            name="imageUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Profile Image</FormLabel>
                                <FormControl>
                                  <div className="flex items-center space-x-4">
                                    {/* Image Preview Circle */}
                                    <div className="relative">
                                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                                        {field.value ? (
                                          <img 
                                            src={field.value} 
                                            alt="Profile preview" 
                                            className="w-18 h-18 rounded-full object-cover"
                                          />
                                        ) : (
                                          <div className="text-center">
                                            <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                            <p className="text-xs text-gray-500">Photo</p>
                                          </div>
                                        )}
                                      </div>
                                      {isUploading && (
                                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* Upload Button */}
                                    <div className="flex-1">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        disabled={isUploading}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            // Create a preview URL immediately
                                            const previewUrl = URL.createObjectURL(file);
                                            field.onChange(previewUrl);
                                            
                                            // Then upload the file
                                            await handleImageUpload(file, (url) => {
                                              URL.revokeObjectURL(previewUrl);
                                              field.onChange(url);
                                            });
                                          }
                                        }}
                                        className="sr-only"
                                        id="profile-image-upload"
                                      />
                                      <label
                                        htmlFor="profile-image-upload"
                                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        {field.value ? "Change Photo" : "Upload Photo"}
                                      </label>
                                      {isUploading && (
                                        <p className="text-sm text-muted-foreground mt-2">Uploading image...</p>
                                      )}
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={playerForm.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>First Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
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
                                  <FormLabel>Last Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={playerForm.control}
                            name="consoleUsername"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>EA Username</FormLabel>
                                <FormControl>
                                  <Input {...field} />
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
                                <FormLabel>Player Position</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select position" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
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

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={playerForm.control}
                              name="jerseyNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Jersey Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                                  <FormLabel>Since</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>


                          <Button type="submit" className="w-full" disabled={createPlayerMutation.isPending || updatePlayerMutation.isPending}>
                            {createPlayerMutation.isPending || updatePlayerMutation.isPending ? "Saving..." : "Save Player"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {playersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {players?.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                            {player.jerseyNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {player.firstName} {player.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {player.position} • @{player.consoleUsername}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deletePlayerMutation.mutate(player.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Player Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {playersLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {players?.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                            {player.jerseyNumber}
                          </div>
                          <div>
                            <div className="font-semibold text-white">
                              {player.firstName} {player.lastName}
                            </div>
                            <Badge variant="outline">{player.position}</Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditStats(player)}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Stats
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {editingStats && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Edit Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Free OCR Stats Extraction Section */}
                  <div className="mb-6 p-4 border border-dashed border-green-300 dark:border-green-600 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                    <h3 className="text-lg font-semibold mb-3 flex items-center text-green-700 dark:text-green-400">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Free OCR Stats Extraction
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Upload a post-match statistics screenshot and let our free OCR technology extract the numbers automatically
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
                        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground rounded-lg font-medium transition-colors ${
                          isOcrProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <Upload className="w-4 h-4 mr-2" />
{isOcrProcessing ? "Extracting..." : "Upload Stats Image"}
                      </label>
                      {isOcrProcessing && (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm font-medium text-primary">{ocrProgress}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Form {...statsForm}>
                    <form onSubmit={statsForm.handleSubmit(onStatsSubmit)} className="space-y-8">
                      
                      {/* Basic Performance Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Basic Performance</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="appearance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>APPEARANCE</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="motm"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>MOTM</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="goals"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>GOALS</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="assists"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>ASSISTS</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="avgRating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>AVG RATING</FormLabel>
                                <FormControl>
                                  <Input type="number" step="0.1" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Shooting Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Shooting</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="shots"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SHOTS</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="shotAccuracy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SHOT ACC (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Passing Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Passing</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="passes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PASSES</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="passAccuracy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PASS ACC (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Dribbling Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Dribbling</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="dribbles"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>DRIBBLES</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="dribbleSuccessRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>DRIBBLE SUCC RATE (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Defensive Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Defending</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="tackles"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>TACKLES</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="tackleSuccessRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>TACKLE SUCC RATE (%)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Possession Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Possession</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="possessionWon"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>POS. WON</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="possessionLost"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>POS. LOST</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm font-medium">POS. DIFF</Label>
                            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded border text-sm">
                              {(statsForm.watch('possessionWon') || 0) - (statsForm.watch('possessionLost') || 0)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Goalkeeping Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Goalkeeping</h3>
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="saves"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>SAVES</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="pkSave"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>PK SAVE</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="cleanSheet"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CLEAN SHEET</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Disciplinary Stats */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Disciplinary</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <FormField
                            control={statsForm.control}
                            name="yellowCards"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>YELLOW</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="redCards"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>RED</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="offsides"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>OFFSIDES</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={statsForm.control}
                            name="foulsCommitted"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>FOULS COMMITTED</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex space-x-4 pt-6">
                        <Button type="submit" disabled={updateStatsMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" />
                          {updateStatsMutation.isPending ? "Saving..." : "Save Statistics"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditingStats(null)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="matches">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Match Calendar</CardTitle>
                  <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setEditingMatch(null)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Match
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>
                          {editingMatch ? "Edit Match" : "Add New Match"}
                        </DialogTitle>
                      </DialogHeader>
                      <Form {...matchForm}>
                        <form onSubmit={matchForm.handleSubmit(onMatchSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="homeTeam"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Home Team</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-home-team" />
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
                                  <FormLabel>Away Team</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-away-team" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="homeTeamLogo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Home Team Logo URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-home-logo" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={matchForm.control}
                              name="awayTeamLogo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Away Team Logo URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-away-logo" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={matchForm.control}
                              name="competition"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Competition</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Bundesliga" data-testid="input-competition" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={matchForm.control}
                              name="matchDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Match Date & Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} data-testid="input-match-date" />
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
                                  <FormLabel>Status</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-status">
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                                      <SelectItem value="Live">Live</SelectItem>
                                      <SelectItem value="FT">Finished</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>


                          {matchForm.watch("status") === "FT" && (
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={matchForm.control}
                                name="homeScore"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Home Score</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
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
                                    <FormLabel>Away Score</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        {...field} 
                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                        data-testid="input-away-score"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          )}

                          <FormField
                            control={matchForm.control}
                            name="replayUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Replay/Highlights URL (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="https://twitch.tv/sevlakev" data-testid="input-replay-url" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Formation and Lineup Section */}
                          <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-lg font-semibold">Team Formation & Lineup</h3>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const currentFormation = matchForm.watch("formation") || "4-3-3";
                                  const currentLineup = matchForm.watch("lineup") || {};
                                  const autoLineup = autoAssignPlayers(currentFormation, currentLineup, players || []);
                                  matchForm.setValue("lineup", autoLineup);
                                }}
                                data-testid="button-auto-assign"
                              >
                                <Shuffle className="w-4 h-4 mr-2" />
                                Auto Assign
                              </Button>
                            </div>
                            <FormationPitch
                              selectedFormation={matchForm.watch("formation") || "4-3-3"}
                              lineup={matchForm.watch("lineup") || {}}
                              players={players || []}
                              isEditing={true}
                              onFormationChange={(formation) => matchForm.setValue("formation", formation)}
                              onLineupChange={(lineup) => matchForm.setValue("lineup", lineup)}
                              className="flex justify-center"
                            />
                          </div>

                          <div className="flex space-x-4 pt-4">
                            <Button type="submit" disabled={createMatchMutation.isPending || updateMatchMutation.isPending} data-testid="button-save-match">
                              <Save className="w-4 h-4 mr-2" />
                              {(createMatchMutation.isPending || updateMatchMutation.isPending) ? "Saving..." : (editingMatch ? "Update Match" : "Create Match")}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setIsMatchDialogOpen(false)} data-testid="button-cancel-match">
                              Cancel
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="text-center py-8">Loading matches...</div>
                ) : !matches || matches.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No matches found. Add your first match to get started!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-4 border rounded-lg" data-testid={`match-card-${match.id}`}>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            {match.homeTeamLogo && (
                              <img src={match.homeTeamLogo} alt={match.homeTeam} className="w-8 h-8" />
                            )}
                            <span className="font-semibold">{match.homeTeam}</span>
                          </div>
                          <div className="text-center">
                            <Badge variant={
                              match.status === "FT" ? "default" : 
                              match.status === "Live" ? "destructive" : 
                              "secondary"
                            }>
                              {match.status}
                            </Badge>
                            {match.status === "FT" && (
                              <div className="text-xl font-bold mt-1">
                                {match.homeScore} - {match.awayScore}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">{match.awayTeam}</span>
                            {match.awayTeamLogo && (
                              <img src={match.awayTeamLogo} alt={match.awayTeam} className="w-8 h-8" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <div>{match.competition}</div>
                            <div>{new Date(match.matchDate).toLocaleDateString()}</div>
                            <div>{new Date(match.matchDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditMatch(match)}
                            data-testid={`button-edit-match-${match.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteMatchMutation.mutate(match.id)}
                            disabled={deleteMatchMutation.isPending}
                            data-testid={`button-delete-match-${match.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}