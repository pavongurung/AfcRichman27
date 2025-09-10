import {
  users,
  players,
  playerStats,
  matches,
  type User,
  type UpsertUser,
  type Player,
  type InsertPlayer,
  type PlayerStats,
  type InsertPlayerStats,
  type Match,
  type InsertMatch,
  type PlayerWithStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Players
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  getPlayersByPosition(position: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(id: string): Promise<boolean>;
  
  // Player Stats
  getPlayerStats(playerId: string, season?: string): Promise<PlayerStats | undefined>;
  getAllPlayersWithStats(season?: string): Promise<PlayerWithStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats | undefined>;
  
  // Matches
  getAllMatches(): Promise<Match[]>;
  getRecentMatches(limit?: number): Promise<Match[]>;
  getMatch(id: string): Promise<Match | undefined>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined>;
  deleteMatch(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Player operations
  async getPlayer(id: string): Promise<Player | undefined> {
    const [player] = await db.select().from(players).where(eq(players.id, id));
    return player;
  }

  async getAllPlayers(): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.isActive, true)).orderBy(players.jerseyNumber);
  }

  async getPlayersByPosition(position: string): Promise<Player[]> {
    return await db.select().from(players).where(eq(players.position, position)).orderBy(players.jerseyNumber);
  }

  async createPlayer(playerData: InsertPlayer): Promise<Player> {
    const [player] = await db
      .insert(players)
      .values(playerData)
      .returning();
    return player;
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const [player] = await db
      .update(players)
      .set(updates)
      .where(eq(players.id, id))
      .returning();
    return player;
  }

  async deletePlayer(id: string): Promise<boolean> {
    const result = await db
      .update(players)
      .set({ isActive: false })
      .where(eq(players.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Player Stats operations
  async getPlayerStats(playerId: string, season: string = "2024-25"): Promise<PlayerStats | undefined> {
    const [stats] = await db
      .select()
      .from(playerStats)
      .where(eq(playerStats.playerId, playerId))
      .limit(1);
    return stats;
  }

  async getAllPlayersWithStats(season: string = "2024-25"): Promise<PlayerWithStats[]> {
    const result = await db
      .select({
        // Player fields
        id: players.id,
        jerseyNumber: players.jerseyNumber,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        nationality: players.nationality,
        dateOfBirth: players.dateOfBirth,
        height: players.height,
        consoleUsername: players.consoleUsername,
        joinDate: players.joinDate,
        imageUrl: players.imageUrl,
        isActive: players.isActive,
        createdAt: players.createdAt,
        // Stats
        stats: {
          id: playerStats.id,
          playerId: playerStats.playerId,
          season: playerStats.season,
          appearance: playerStats.appearance,
          motm: playerStats.motm,
          goals: playerStats.goals,
          assists: playerStats.assists,
          avgRating: playerStats.avgRating,
          shots: playerStats.shots,
          shotAccuracy: playerStats.shotAccuracy,
          passes: playerStats.passes,
          passAccuracy: playerStats.passAccuracy,
          dribbles: playerStats.dribbles,
          dribbleSuccessRate: playerStats.dribbleSuccessRate,
          tackles: playerStats.tackles,
          tackleSuccessRate: playerStats.tackleSuccessRate,
          offsides: playerStats.offsides,
          foulsCommitted: playerStats.foulsCommitted,
          possessionWon: playerStats.possessionWon,
          possessionLost: playerStats.possessionLost,
          possessionDifference: playerStats.possessionDifference,
          minutesPlayed: playerStats.minutesPlayed,
          distanceCovered: playerStats.distanceCovered,
          distanceSprinted: playerStats.distanceSprinted,
          saves: playerStats.saves,
          pkSave: playerStats.pkSave,
          cleanSheet: playerStats.cleanSheet,
          yellowCards: playerStats.yellowCards,
          redCards: playerStats.redCards,
          gamesPlayed: playerStats.gamesPlayed,
          minutes: playerStats.minutes,
          starts: playerStats.starts,
          substituteOn: playerStats.substituteOn,
          substituteOff: playerStats.substituteOff,
          leftFootedGoals: playerStats.leftFootedGoals,
          rightFootedGoals: playerStats.rightFootedGoals,
          headedGoals: playerStats.headedGoals,
          createdAt: playerStats.createdAt,
        }
      })
      .from(players)
      .leftJoin(playerStats, eq(players.id, playerStats.playerId))
      .where(eq(players.isActive, true))
      .orderBy(players.jerseyNumber);

    return result.map(row => ({
      ...row,
      stats: row.stats?.id ? row.stats : null
    }));
  }

  async createPlayerStats(statsData: InsertPlayerStats): Promise<PlayerStats> {
    const [stats] = await db
      .insert(playerStats)
      .values(statsData)
      .returning();
    return stats;
  }

  async updatePlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const [stats] = await db
      .update(playerStats)
      .set(updates)
      .where(eq(playerStats.playerId, playerId))
      .returning();
    return stats;
  }

  // Match operations
  async getAllMatches(): Promise<Match[]> {
    const allMatches = await db.select().from(matches);
    
    // Sort by status priority: FT first, Live second, Upcoming third
    return allMatches.sort((a, b) => {
      const statusPriority: Record<string, number> = { "FT": 1, "Live": 2, "Upcoming": 3 };
      const priorityA = statusPriority[a.status] || 4;
      const priorityB = statusPriority[b.status] || 4;
      
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If same status, sort by date (newest first)
      return new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime();
    });
  }

  async getRecentMatches(limit: number = 5): Promise<Match[]> {
    const allMatches = await this.getAllMatches();
    return allMatches.slice(0, limit);
  }

  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async createMatch(matchData: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(matchData)
      .returning();
    return match;
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set(updates)
      .where(eq(matches.id, id))
      .returning();
    return match;
  }

  async deleteMatch(id: string): Promise<boolean> {
    const result = await db.delete(matches).where(eq(matches.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();