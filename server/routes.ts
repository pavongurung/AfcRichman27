import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPlayerSchema, insertPlayerStatsSchema, insertMatchSchema } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { z } from "zod";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware - temporarily disabled for testing
  // await setupAuth(app);

  // Auth routes - temporarily disabled
  app.get('/api/auth/user', async (req: any, res) => {
    // Return mock user for testing
    res.json({ id: "test-user", email: "test@example.com" });
  });

  // OpenAI OCR endpoint for extracting stats from images
  app.post("/api/extract-stats", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      
      if (!image) {
        return res.status(400).json({ error: "No image provided" });
      }

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this football/soccer statistics image and extract the numerical values for each statistic. 

Please extract stats for these fields and return ONLY a JSON object with the exact field names:
- appearance (appearances/games played)
- motm (man of the match awards)
- goals
- assists
- avgRating (average rating, typically 0-10 scale)
- shots
- shotAccuracy (shot accuracy percentage, 0-100)
- passes
- passAccuracy (pass accuracy percentage, 0-100)
- dribbles
- dribbleSuccessRate (dribble success rate percentage, 0-100)
- tackles
- tackleSuccessRate (tackle success rate percentage, 0-100)
- possessionWon
- possessionLost
- saves
- pkSave (penalty saves)
- cleanSheet (clean sheets)
- yellowCards
- redCards
- offsides
- foulsCommitted

Return ONLY valid JSON in this exact format: {"fieldName": numberValue}. Do not include any explanation or additional text.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${image}`
                }
              }
            ]
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return res.status(500).json({ error: "No response from AI" });
      }

      try {
        const extractedStats = JSON.parse(content);
        console.log("Extracted stats from OpenAI:", extractedStats);
        res.json({ extractedStats });
      } catch (parseError) {
        console.error("Failed to parse AI response:", content);
        res.status(500).json({ error: "Invalid response format from AI" });
      }

    } catch (error) {
      console.error("OpenAI OCR error:", error);
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