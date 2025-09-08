import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertPlayerStatsSchema, insertMatchSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { z } from "zod";
// Enhanced parsing function for football statistics
function parseFootballStats(text: string): Record<string, number> {
  const stats: Record<string, number> = {};
  const lines = text.split('\n').filter(line => line.trim());
  
  console.log("Parsing OCR text lines:", lines);
  
  // Enhanced patterns for parsing football game stats
  const patterns = {
    // Basic stats - more flexible patterns
    goals: [/goals?\s*:?\s*(\d+)/i, /(\d+)\s*goals?/i, /G\s*(\d+)/i, /GOALS\s+(\d+)/i],
    assists: [/assists?\s*:?\s*(\d+)/i, /(\d+)\s*assists?/i, /A\s*(\d+)/i, /ASSISTS\s+(\d+)/i],
    shots: [/shots?\s*:?\s*(\d+)/i, /(\d+)\s*shots?/i, /SH\s*(\d+)/i, /SHOTS\s+(\d+)/i],
    passes: [/passes?\s*:?\s*(\d+)/i, /(\d+)\s*passes?/i, /P\s*(\d+)/i, /PASSES\s+(\d+)/i],
    tackles: [/tackles?\s*:?\s*(\d+)/i, /(\d+)\s*tackles?/i, /T\s*(\d+)/i, /TACKLES\s+(\d+)/i],
    saves: [/saves?\s*:?\s*(\d+)/i, /(\d+)\s*saves?/i, /SV\s*(\d+)/i, /SAVES\s+(\d+)/i],
    dribbles: [/dribbles?\s*:?\s*(\d+)/i, /(\d+)\s*dribbles?/i, /DR\s*(\d+)/i, /DRIBBLES\s+(\d+)/i],
    offsides: [/offsides?\s*:?\s*(\d+)/i, /(\d+)\s*offsides?/i, /OFF\s*(\d+)/i],
    foulsCommitted: [/fouls?\s*(committed)?\s*:?\s*(\d+)/i, /(\d+)\s*fouls?/i, /FC\s*(\d+)/i],
    yellowCards: [/yellow\s*cards?\s*:?\s*(\d+)/i, /(\d+)\s*yellow/i, /YC\s*(\d+)/i],
    redCards: [/red\s*cards?\s*:?\s*(\d+)/i, /(\d+)\s*red/i, /RC\s*(\d+)/i],
    
    // Percentage and rating stats
    avgRating: [/rating\s*:?\s*(\d+\.?\d*)/i, /(\d+\.?\d*)\s*rating/i, /RAT\s*(\d+\.?\d*)/i, /AVG\s*RATING\s+(\d+\.?\d*)/i],
    shotAccuracy: [/shot\s*acc(uracy)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*shot\s*acc/i, /SHA\s*(\d+)%?/i, /SHOT\s*ACC.*?(\d+)%?/i],
    passAccuracy: [/pass\s*acc(uracy)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*pass\s*acc/i, /PA\s*(\d+)%?/i, /PASS\s*ACC.*?(\d+)%?/i],
    tackleSuccessRate: [/tackle\s*succ(ess)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*tackle/i, /TS\s*(\d+)%?/i, /TACKLE\s*SUCC.*?(\d+)%?/i],
    dribbleSuccessRate: [/dribble\s*succ(ess)?\s*:?\s*(\d+)%?/i, /(\d+)%?\s*dribble/i, /DS\s*(\d+)%?/i, /DRIBBLE\s*SUCC.*?(\d+)%?/i],
    
    // Advanced stats  
    possessionWon: [/possession\s*won\s*:?\s*(\d+)/i, /(\d+)\s*pos\s*won/i, /PW\s*(\d+)/i, /POS.*?WON\s+(\d+)/i],
    possessionLost: [/possession\s*lost\s*:?\s*(\d+)/i, /(\d+)\s*pos\s*lost/i, /PL\s*(\d+)/i, /POS.*?LOST\s+(\d+)/i],
    cleanSheet: [/clean\s*sheet\s*:?\s*(\d+)/i, /(\d+)\s*clean/i, /CS\s*(\d+)/i],
    pkSave: [/pk\s*save\s*:?\s*(\d+)/i, /penalty\s*save\s*:?\s*(\d+)/i, /(\d+)\s*pk\s*save/i, /PS\s*(\d+)/i],
    
    // Alternative forms
    appearance: [/appear(ance)?\s*:?\s*(\d+)/i, /(\d+)\s*app/i, /APP\s*(\d+)/i, /APPEARANCE\s+(\d+)/i],
    motm: [/motm\s*:?\s*(\d+)/i, /man\s*of\s*match\s*:?\s*(\d+)/i, /(\d+)\s*motm/i, /MOTM\s+(\d+)/i],
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
            stats[key] = key === 'avgRating' ? Math.round(value * 10) / 10 : Math.round(value);
            console.log(`Found ${key}: ${value} from line: "${line}"`);
            found = true;
            break;
          }
        }
      }
    }
  }

  // Look for numeric patterns in structured layouts
  const fullText = text.replace(/\n/g, ' ');
  
  // Try to find number sequences that might be stats
  const numberMatches = fullText.match(/\d+/g);
  if (numberMatches && numberMatches.length > 0) {
    console.log("Found numbers in text:", numberMatches);
  }

  return stats;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - temporarily disabled for testing
  // await setupAuth(app);

  // Auth routes - temporarily disabled
  app.get('/api/auth/user', async (req: any, res) => {
    // Return mock user for testing
    res.json({ id: "test-user", email: "test@example.com" });
  });

  // Free Tesseract OCR endpoint for extracting stats from images
  app.post("/api/extract-stats", async (req, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      console.log("Processing image with Tesseract OCR...");

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(image, 'base64');
      
      // Import Tesseract dynamically
      const Tesseract = await import('tesseract.js');
      
      // Enhanced OCR with better configuration for sports statistics
      const { data: { text } } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: info => {
          if (info.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(info.progress * 100)}%`);
          }
        }
      });

      console.log("Raw OCR Text:", text);

      // Enhanced parsing for football statistics
      const extractedStats = parseFootballStats(text);
      console.log("Extracted stats:", extractedStats);
      
      res.json({ extractedStats });

    } catch (error) {
      console.error("Tesseract OCR error:", error);
      res.status(500).json({ error: "Failed to analyze image" });
    }
  });

  // Player routes (public)
  app.get("/api/players", async (req, res) => {
    try {
      const { position } = req.query;
      const players = position 
        ? await storage.getPlayersByPosition(position as string)
        : await storage.getAllPlayers();
      res.json(players);
    } catch (error) {
      console.error("Error fetching players:", error);
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.get("/api/players/:id", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.id);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      console.error("Error fetching player:", error);
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const stats = await storage.getPlayerStats(req.params.id, req.query.season as string);
      if (!stats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error fetching player stats:", error);
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.get("/api/players-with-stats", async (req, res) => {
    try {
      const players = await storage.getAllPlayersWithStats(req.query.season as string);
      res.json(players);
    } catch (error) {
      console.error("Error fetching players with stats:", error);
      res.status(500).json({ message: "Failed to fetch players with stats" });
    }
  });

  // Admin routes (protected)
  app.post("/api/admin/players", async (req, res) => {
    try {
      const playerData = insertPlayerSchema.parse(req.body);
      const player = await storage.createPlayer(playerData);
      
      // Create default stats for new player
      await storage.createPlayerStats({
        playerId: player.id,
        season: "2024-25",
      });
      
      res.status(201).json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error creating player:", error);
      res.status(500).json({ message: "Failed to create player" });
    }
  });

  app.put("/api/admin/players/:id", async (req, res) => {
    try {
      const updates = insertPlayerSchema.partial().parse(req.body);
      const player = await storage.updatePlayer(req.params.id, updates);
      
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      
      res.json(player);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid player data", errors: error.errors });
      }
      console.error("Error updating player:", error);
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  app.delete("/api/admin/players/:id", isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deletePlayer(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json({ message: "Player deleted successfully" });
    } catch (error) {
      console.error("Error deleting player:", error);
      res.status(500).json({ message: "Failed to delete player" });
    }
  });

  app.put("/api/admin/players/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const statsData = insertPlayerStatsSchema.partial().parse(req.body);
      const stats = await storage.updatePlayerStats(req.params.id, statsData);
      
      if (!stats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      
      res.json(stats);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid stats data", errors: error.errors });
      }
      console.error("Error updating player stats:", error);
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });

  // Object storage routes
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.put("/api/player-images", isAuthenticated, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    // Gets the authenticated user id.
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.sub || (req.user as any)?.id;

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          // Player images should be public so they can be displayed on the website
          visibility: "public",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting player image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Match routes
  app.get("/api/matches", async (req, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  app.get("/api/matches/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const matches = await storage.getRecentMatches(limit);
      res.json(matches);
    } catch (error) {
      console.error("Error fetching recent matches:", error);
      res.status(500).json({ message: "Failed to fetch recent matches" });
    }
  });

  app.post("/api/admin/matches", isAuthenticated, async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);
      res.status(201).json(match);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid match data", errors: error.errors });
      }
      console.error("Error creating match:", error);
      res.status(500).json({ message: "Failed to create match" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}