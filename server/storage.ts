import { type Player, type InsertPlayer, type PlayerStats, type InsertPlayerStats, type Match, type InsertMatch, type PlayerWithStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Players
  getPlayer(id: string): Promise<Player | undefined>;
  getAllPlayers(): Promise<Player[]>;
  getPlayersByPosition(position: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  
  // Player Stats
  getPlayerStats(playerId: string, season?: string): Promise<PlayerStats | undefined>;
  getAllPlayersWithStats(season?: string): Promise<PlayerWithStats[]>;
  createPlayerStats(stats: InsertPlayerStats): Promise<PlayerStats>;
  updatePlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats | undefined>;
  
  // Matches
  getAllMatches(): Promise<Match[]>;
  getRecentMatches(limit?: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
}

export class MemStorage implements IStorage {
  private players: Map<string, Player>;
  private playerStats: Map<string, PlayerStats>;
  private matches: Map<string, Match>;

  constructor() {
    this.players = new Map();
    this.playerStats = new Map();
    this.matches = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed players
    const playersData: Array<Omit<Player, 'id' | 'createdAt'>> = [
      { jerseyNumber: 1, firstName: "David", lastName: "Rodriguez", position: "Goalkeeper", nationality: "Spain", dateOfBirth: "1992-03-15", height: "1.90m", joinDate: "2022-07-01", imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 12, firstName: "Thomas", lastName: "Brown", position: "Goalkeeper", nationality: "England", dateOfBirth: "1994-08-22", height: "1.88m", joinDate: "2023-01-15", imageUrl: "https://images.unsplash.com/photo-1591013355309-db8ec65ca384?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 2, firstName: "Lucas", lastName: "Silva", position: "Defender", nationality: "Brazil", dateOfBirth: "1993-06-10", height: "1.82m", joinDate: "2021-08-20", imageUrl: "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 3, firstName: "Roberto", lastName: "Garcia", position: "Defender", nationality: "Argentina", dateOfBirth: "1991-12-05", height: "1.85m", joinDate: "2020-06-30", imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 4, firstName: "James", lastName: "Wilson", position: "Defender", nationality: "England", dateOfBirth: "1995-01-18", height: "1.83m", joinDate: "2022-01-10", imageUrl: "https://images.unsplash.com/photo-1552667466-07770ae110d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 5, firstName: "Michael", lastName: "Anderson", position: "Defender", nationality: "Scotland", dateOfBirth: "1994-04-25", height: "1.87m", joinDate: "2023-02-14", imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 6, firstName: "Daniel", lastName: "Foster", position: "Midfielder", nationality: "Ireland", dateOfBirth: "1992-09-30", height: "1.78m", joinDate: "2021-07-15", imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 8, firstName: "Alex", lastName: "Johnson", position: "Midfielder", nationality: "England", dateOfBirth: "1996-02-14", height: "1.75m", joinDate: "2022-08-01", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 11, firstName: "Ryan", lastName: "Miller", position: "Midfielder", nationality: "Wales", dateOfBirth: "1993-11-08", height: "1.80m", joinDate: "2020-09-01", imageUrl: "https://images.unsplash.com/photo-1594736797933-d0c6b3935a1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 7, firstName: "Luis", lastName: "Martinez", position: "Forward", nationality: "Spain", dateOfBirth: "1994-05-20", height: "1.77m", joinDate: "2021-06-15", imageUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 9, firstName: "Marcus", lastName: "Thompson", position: "Forward", nationality: "England", dateOfBirth: "1995-03-15", height: "1.83m", joinDate: "2022-07-01", imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 10, firstName: "Carlos", lastName: "Silva", position: "Forward", nationality: "Portugal", dateOfBirth: "1993-07-12", height: "1.81m", joinDate: "2021-01-20", imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 14, firstName: "Mosh", lastName: "Hamedani", position: "Midfielder", nationality: "Canada", dateOfBirth: "1990-08-15", height: "1.79m", joinDate: "2023-06-01", imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
    ];

    playersData.forEach(playerData => {
      const id = randomUUID();
      const player: Player = {
        ...playerData,
        id,
        createdAt: new Date(),
      };
      this.players.set(id, player);

      // Create stats for each player
      const statsId = randomUUID();
      const stats: PlayerStats = {
        id: statsId,
        playerId: id,
        season: "2024-25",
        gamesPlayed: Math.floor(Math.random() * 25) + 1,
        minutes: Math.floor(Math.random() * 2000) + 500,
        goals: playerData.position === "Forward" ? Math.floor(Math.random() * 20) : playerData.position === "Midfielder" ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 3),
        assists: Math.floor(Math.random() * 15),
        yellowCards: Math.floor(Math.random() * 8),
        redCards: Math.floor(Math.random() * 2),
        starts: Math.floor(Math.random() * 20) + 5,
        substituteOn: Math.floor(Math.random() * 5),
        substituteOff: Math.floor(Math.random() * 10),
        leftFootedGoals: Math.floor(Math.random() * 5),
        rightFootedGoals: Math.floor(Math.random() * 8),
        headedGoals: Math.floor(Math.random() * 3),
        createdAt: new Date(),
      };
      this.playerStats.set(statsId, stats);
    });

    // Seed matches
    const matchesData: Array<Omit<Match, 'id' | 'createdAt'>> = [
      {
        homeTeam: "AFC Richman",
        awayTeam: "Chelsea FC",
        homeTeamLogo: "AFC",
        awayTeamLogo: "CHE",
        homeScore: 3,
        awayScore: 1,
        competition: "Premier League",
        matchDate: new Date("2024-12-15T15:30:00"),
        venue: "Richman Stadium",
        status: "FT",
        replayUrl: "https://www.twitch.tv/sevlakev/video/example1"
      },
      {
        homeTeam: "Liverpool FC",
        awayTeam: "AFC Richman",
        homeTeamLogo: "LIV",
        awayTeamLogo: "AFC",
        homeScore: null,
        awayScore: null,
        competition: "Champions League",
        matchDate: new Date("2024-12-22T20:00:00"),
        venue: "Anfield",
        status: "Upcoming",
        replayUrl: null
      },
      {
        homeTeam: "AFC Richman",
        awayTeam: "Wolverhampton",
        homeTeamLogo: "AFC",
        awayTeamLogo: "WOL",
        homeScore: 2,
        awayScore: 0,
        competition: "FA Cup",
        matchDate: new Date("2024-12-10T14:00:00"),
        venue: "Richman Stadium",
        status: "FT",
        replayUrl: "https://www.twitch.tv/sevlakev/video/example2"
      }
    ];

    matchesData.forEach(matchData => {
      const id = randomUUID();
      const match: Match = {
        ...matchData,
        id,
        createdAt: new Date(),
      };
      this.matches.set(id, match);
    });
  }

  async getPlayer(id: string): Promise<Player | undefined> {
    return this.players.get(id);
  }

  async getAllPlayers(): Promise<Player[]> {
    return Array.from(this.players.values()).sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }

  async getPlayersByPosition(position: string): Promise<Player[]> {
    return Array.from(this.players.values())
      .filter(player => player.position === position)
      .sort((a, b) => a.jerseyNumber - b.jerseyNumber);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = randomUUID();
    const player: Player = { 
      ...insertPlayer, 
      id,
      createdAt: new Date(),
    };
    this.players.set(id, player);
    return player;
  }

  async getPlayerStats(playerId: string, season: string = "2024-25"): Promise<PlayerStats | undefined> {
    return Array.from(this.playerStats.values()).find(
      stats => stats.playerId === playerId && stats.season === season
    );
  }

  async getAllPlayersWithStats(season: string = "2024-25"): Promise<PlayerWithStats[]> {
    const players = await this.getAllPlayers();
    return Promise.all(
      players.map(async player => {
        const stats = await this.getPlayerStats(player.id, season);
        return { ...player, stats };
      })
    );
  }

  async createPlayerStats(insertStats: InsertPlayerStats): Promise<PlayerStats> {
    const id = randomUUID();
    const stats: PlayerStats = { 
      ...insertStats, 
      id,
      createdAt: new Date(),
    };
    this.playerStats.set(id, stats);
    return stats;
  }

  async updatePlayerStats(playerId: string, updates: Partial<PlayerStats>): Promise<PlayerStats | undefined> {
    const existingStats = await this.getPlayerStats(playerId);
    if (!existingStats) return undefined;

    const updatedStats: PlayerStats = {
      ...existingStats,
      ...updates,
    };
    this.playerStats.set(existingStats.id, updatedStats);
    return updatedStats;
  }

  async getAllMatches(): Promise<Match[]> {
    return Array.from(this.matches.values()).sort((a, b) => 
      new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()
    );
  }

  async getRecentMatches(limit: number = 10): Promise<Match[]> {
    const matches = await this.getAllMatches();
    return matches.slice(0, limit);
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = randomUUID();
    const match: Match = { 
      ...insertMatch, 
      id,
      createdAt: new Date(),
    };
    this.matches.set(id, match);
    return match;
  }
}

export const storage = new MemStorage();
