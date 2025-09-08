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
import type { Player, PlayerStats, InsertPlayer, InsertPlayerStats } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { createWorker } from "tesseract.js";

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

type PlayerFormData = z.infer<typeof playerFormSchema>;
type StatsFormData = z.infer<typeof statsFormSchema>;

export default function AdminPanel() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [isPlayerDialogOpen, setIsPlayerDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingStats, setEditingStats] = useState<PlayerStats | null>(null);
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

  const preprocessImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        
        // Scale image for better OCR (aim for 1000px width)
        const maxWidth = 1000;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        // Draw image with enhancements for better OCR
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = 'contrast(200%) brightness(150%)';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Convert to high-quality data URL
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleOcrImageUpload = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      setOcrProgress(0);
      
      toast({
        title: "Processing Image",
        description: "Preprocessing image for better text recognition...",
      });

      // Preprocess image for better OCR
      const processedImageUrl = await preprocessImage(file);
      
      // Create Tesseract worker with progress tracking
      const worker = createWorker({
        logger: ({ status, progress }) => {
          console.log(`OCR ${status}: ${Math.round(progress * 100)}%`);
          setOcrProgress(Math.round(progress * 100));
        }
      });

      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');

      // Configure OCR for better number and text recognition
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz:.%()- \n',
        tessedit_pageseg_mode: 6, // Uniform block of text
        preserve_interword_spaces: '1',
      });

      console.log("Starting OCR recognition...");
      const { data: { text, confidence } } = await worker.recognize(processedImageUrl);
      await worker.terminate();

      console.log("OCR Results:", { text, confidence });

      if (!text || text.trim().length === 0) {
        throw new Error("No text detected in image");
      }

      // Parse the extracted text to identify stats
      const extractedStats = parseOcrText(text);
      
      console.log("Extracted stats:", extractedStats);

      if (Object.keys(extractedStats).length === 0) {
        toast({
          title: "No Stats Found",
          description: "Could not identify football statistics in the image. Try a clearer image with visible stat labels.",
          variant: "destructive",
        });
        return;
      }
      
      // Auto-fill the form with extracted data
      Object.entries(extractedStats).forEach(([key, value]) => {
        if (statsForm.getValues(key as keyof StatsFormData) !== undefined) {
          statsForm.setValue(key as keyof StatsFormData, value);
        }
      });

      toast({
        title: "OCR Complete",
        description: `Successfully extracted ${Object.keys(extractedStats).length} stat values! Check the form fields.`,
      });

    } catch (error) {
      console.error("OCR error:", error);
      toast({
        title: "OCR Failed",
        description: error instanceof Error ? error.message : "Could not extract text from image. Please try again with a clearer image.",
        variant: "destructive",
      });
    } finally {
      setIsOcrProcessing(false);
      setOcrProgress(0);
    }
  };

  const parseOcrText = (text: string): Partial<StatsFormData> => {
    const stats: Partial<StatsFormData> = {};
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log("Parsing OCR text lines:", lines);
    
    // Enhanced patterns for parsing football game stats
    const patterns = {
      // Basic stats
      goals: [/goals?\s*:?\s*(\d+)/i, /(\d+)\s*goals?/i, /G\s*(\d+)/i],
      assists: [/assists?\s*:?\s*(\d+)/i, /(\d+)\s*assists?/i, /A\s*(\d+)/i],
      shots: [/shots?\s*:?\s*(\d+)/i, /(\d+)\s*shots?/i, /SH\s*(\d+)/i],
      passes: [/passes?\s*:?\s*(\d+)/i, /(\d+)\s*passes?/i, /P\s*(\d+)/i],
      tackles: [/tackles?\s*:?\s*(\d+)/i, /(\d+)\s*tackles?/i, /T\s*(\d+)/i],
      saves: [/saves?\s*:?\s*(\d+)/i, /(\d+)\s*saves?/i, /SV\s*(\d+)/i],
      dribbles: [/dribbles?\s*:?\s*(\d+)/i, /(\d+)\s*dribbles?/i, /DR\s*(\d+)/i],
      offsides: [/offsides?\s*:?\s*(\d+)/i, /(\d+)\s*offsides?/i, /OFF\s*(\d+)/i],
      foulsCommitted: [/fouls?\s*(committed)?\s*:?\s*(\d+)/i, /(\d+)\s*fouls?/i, /FC\s*(\d+)/i],
      yellowCards: [/yellow\s*cards?\s*:?\s*(\d+)/i, /(\d+)\s*yellow/i, /YC\s*(\d+)/i],
      redCards: [/red\s*cards?\s*:?\s*(\d+)/i, /(\d+)\s*red/i, /RC\s*(\d+)/i],
      
      // Percentage stats
      avgRating: [/rating\s*:?\s*(\d+\.?\d*)/i, /(\d+\.?\d*)\s*rating/i, /RAT\s*(\d+\.?\d*)/i],
      shotAccuracy: [/shot\s*acc(uracy)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*shot\s*acc/i, /SHA\s*(\d+)%?/i],
      passAccuracy: [/pass\s*acc(uracy)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*pass\s*acc/i, /PA\s*(\d+)%?/i],
      tackleSuccessRate: [/tackle\s*succ(ess)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*tackle/i, /TS\s*(\d+)%?/i],
      dribbleSuccessRate: [/dribble\s*succ(ess)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*dribble/i, /DS\s*(\d+)%?/i],
      
      // Possession stats
      possessionWon: [/possession\s*won\s*:?\s*(\d+)/i, /(\d+)\s*pos\s*won/i, /PW\s*(\d+)/i],
      possessionLost: [/possession\s*lost\s*:?\s*(\d+)/i, /(\d+)\s*pos\s*lost/i, /PL\s*(\d+)/i],
      cleanSheet: [/clean\s*sheet\s*:?\s*(\d+)/i, /(\d+)\s*clean/i, /CS\s*(\d+)/i],
      pkSave: [/pk\s*save\s*:?\s*(\d+)/i, /penalty\s*save\s*:?\s*(\d+)/i, /(\d+)\s*pk\s*save/i, /PS\s*(\d+)/i],
      
      // Alternative forms
      appearance: [/appear(ance)?\s*:?\s*(\d+)/i, /(\d+)\s*app/i, /APP\s*(\d+)/i],
      motm: [/motm\s*:?\s*(\d+)/i, /man\s*of\s*match\s*:?\s*(\d+)/i, /(\d+)\s*motm/i],
    };

    // Try to extract stats using multiple patterns per stat
    for (const [key, patternArray] of Object.entries(patterns)) {
      let found = false;
      
      for (const pattern of patternArray) {
        if (found) break;
        
        for (const line of lines) {
          const match = line.match(pattern);
          if (match) {
            const value = parseFloat(match[match.length - 1]);
            if (!isNaN(value)) {
              (stats as any)[key] = key === 'avgRating' ? Math.round(value * 10) / 10 : Math.round(value);
              console.log(`Found ${key}: ${value} from line: "${line}"`);
              found = true;
              break;
            }
          }
        }
      }
    }

    // Look for numeric sequences that might be stats (fallback)
    const numberSequences = text.match(/\d+/g);
    if (numberSequences && numberSequences.length > 0) {
      console.log("Found numbers:", numberSequences);
    }

    return stats;
  };

  const { data: players, isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ["/api/players"],
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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="players">Player Management</TabsTrigger>
            <TabsTrigger value="stats">Statistics Management</TabsTrigger>
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
                  {/* OCR Upload Section */}
                  <div className="mb-6 p-4 border border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <ImageIcon className="w-5 h-5 mr-2" />
                      Auto-Extract Stats from Image
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                      Upload a post-match statistics screenshot and automatically extract the numbers
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
                        id="ocr-image-upload"
                        disabled={isOcrProcessing}
                      />
                      <label
                        htmlFor="ocr-image-upload"
                        className="cursor-pointer inline-flex items-center px-4 py-2 border border-primary text-primary bg-background hover:bg-primary hover:text-primary-foreground rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isOcrProcessing ? "Processing..." : "Upload Stats Image"}
                      </label>
                      {isOcrProcessing && (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-gray-600">{ocrProgress}%</span>
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
        </Tabs>
      </div>
    </div>
  );
}