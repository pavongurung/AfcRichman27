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
import { Pencil, Trash2, Plus, Upload, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Player, PlayerStats, InsertPlayer, InsertPlayerStats } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { UploadResult } from "@uppy/core";

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
  appearance: z.number().min(0).default(0),
  motm: z.number().min(0).default(0),
  goals: z.number().min(0).default(0),
  assists: z.number().min(0).default(0),
  avgRating: z.number().min(0).max(100).default(0),
  shots: z.number().min(0).default(0),
  shotAccuracy: z.number().min(0).max(100).default(0),
  passes: z.number().min(0).default(0),
  passAccuracy: z.number().min(0).max(100).default(0),
  dribbles: z.number().min(0).default(0),
  dribbleSuccessRate: z.number().min(0).max(100).default(0),
  tackles: z.number().min(0).default(0),
  tackleSuccessRate: z.number().min(0).max(100).default(0),
  possessionWon: z.number().min(0).default(0),
  possessionLost: z.number().min(0).default(0),
  cleanSheet: z.number().min(0).default(0),
  saves: z.number().min(0).default(0),
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
  const queryClient = useQueryClient();

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
      return await apiRequest("/api/admin/players", "POST", data);
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
      return await apiRequest(`/api/admin/players/${id}`, "PUT", data);
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
                          <div className="flex justify-center mb-4">
                            <ObjectUploader
                              maxNumberOfFiles={1}
                              maxFileSize={5242880} // 5MB
                              onGetUploadParameters={async () => {
                                const response = await fetch("/api/objects/upload", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                });
                                if (!response.ok) throw new Error("Failed to get upload URL");
                                const data = await response.json();
                                return {
                                  method: "PUT" as const,
                                  url: data.uploadURL,
                                };
                              }}
                              onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                                if (result.successful && result.successful[0]) {
                                  const uploadURL = result.successful[0].uploadURL;
                                  // Set the ACL policy and get the normalized path
                                  fetch("/api/player-images", {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ imageURL: uploadURL }),
                                  })
                                  .then(res => res.json())
                                  .then(data => {
                                    // Update the form with the object path
                                    playerForm.setValue("imageUrl", data.objectPath);
                                  })
                                  .catch(err => {
                                    console.error("Error setting image ACL:", err);
                                  });
                                }
                              }}
                            >
                              <div className="flex flex-col items-center justify-center w-24 h-24 bg-muted rounded-lg cursor-pointer hover:bg-muted/80 transition-colors">
                                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                <span className="text-xs text-muted-foreground">Upload</span>
                              </div>
                            </ObjectUploader>
                          </div>
                          
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
                  <Form {...statsForm}>
                    <form onSubmit={statsForm.handleSubmit(onStatsSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={statsForm.control}
                          name="appearance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Appearances</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                              <FormLabel>MOTM</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                              <FormLabel>Goals</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                              <FormLabel>Assists</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={statsForm.control}
                          name="shots"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shots</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="shotAccuracy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Shot Accuracy (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="passes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Passes</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="passAccuracy"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pass Accuracy (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={statsForm.control}
                          name="tackles"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tackles</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="tackleSuccessRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tackle Success Rate (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="yellowCards"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Yellow Cards</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={statsForm.control}
                          name="redCards"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Red Cards</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={updateStatsMutation.isPending}>
                        <Save className="w-4 h-4 mr-2" />
                        {updateStatsMutation.isPending ? "Saving..." : "Save Statistics"}
                      </Button>
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