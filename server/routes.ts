import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });
  // Players routes
  app.get("/api/players", async (req, res) => {
    try {
      const position = req.query.position as string;
      let players;
      
      if (position) {
        players = await storage.getPlayersByPosition(position);
      } else {
        players = await storage.getAllPlayers();
      }
      
      res.json(players);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch player" });
    }
  });

  app.get("/api/players/:id/stats", async (req, res) => {
    try {
      const season = req.query.season as string || "2024-25";
      const stats = await storage.getPlayerStats(req.params.id, season);
      if (!stats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player stats" });
    }
  });

  app.get("/api/players-with-stats", async (req, res) => {
    try {
      const season = req.query.season as string || "2024-25";
      const playersWithStats = await storage.getAllPlayersWithStats(season);
      res.json(playersWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players with stats" });
    }
  });

  app.patch("/api/players/:id/stats", async (req, res) => {
    try {
      const playerId = req.params.id;
      const updates = req.body;
      
      const updatedStats = await storage.updatePlayerStats(playerId, updates);
      if (!updatedStats) {
        return res.status(404).json({ message: "Player stats not found" });
      }
      
      res.json(updatedStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player stats" });
    }
  });

  // Matches routes
  app.get("/api/matches", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      let matches;
      
      if (limit) {
        matches = await storage.getRecentMatches(limit);
      } else {
        matches = await storage.getAllMatches();
      }
      
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
