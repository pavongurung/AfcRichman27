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
      { jerseyNumber: 1, firstName: "Ian", lastName: "", position: "Goalkeeper", nationality: "England", dateOfBirth: "1992-03-15", height: "1.90m", joinDate: "2022-07-01", imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 2, firstName: "Eddy", lastName: "", position: "Defender", nationality: "France", dateOfBirth: "1993-06-10", height: "1.82m", joinDate: "2021-08-20", imageUrl: "/assets/eddy-profile.png", isActive: true },
      { jerseyNumber: 3, firstName: "Bora", lastName: "", position: "Defender", nationality: "Serbia", dateOfBirth: "1991-12-05", height: "1.85m", joinDate: "2020-06-30", imageUrl: "/assets/bora-profile.png", isActive: true },
      { jerseyNumber: 4, firstName: "Kevin", lastName: "", position: "Defender", nationality: "Germany", dateOfBirth: "1995-01-18", height: "1.83m", joinDate: "2022-01-10", imageUrl: "https://images.unsplash.com/photo-1552667466-07770ae110d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 5, firstName: "Mosh", lastName: "", position: "Midfielder", nationality: "Canada", dateOfBirth: "1990-08-15", height: "1.79m", joinDate: "2023-06-01", imageUrl: "/assets/mosh-profile.png", isActive: true },
      { jerseyNumber: 6, firstName: "Xan", lastName: "", position: "Midfielder", nationality: "Spain", dateOfBirth: "1992-09-30", height: "1.78m", joinDate: "2021-07-15", imageUrl: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 7, firstName: "Jojo", lastName: "", position: "Forward", nationality: "Brazil", dateOfBirth: "1994-05-20", height: "1.77m", joinDate: "2021-06-15", imageUrl: "/assets/johan-profile.png", isActive: true },
      { jerseyNumber: 8, firstName: "Dom", lastName: "", position: "Midfielder", nationality: "Portugal", dateOfBirth: "1996-02-14", height: "1.75m", joinDate: "2022-08-01", imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 9, firstName: "Salt", lastName: "", position: "Forward", nationality: "Netherlands", dateOfBirth: "1995-03-15", height: "1.83m", joinDate: "2022-07-01", imageUrl: "/assets/salt-profile.png", isActive: true },
      { jerseyNumber: 10, firstName: "Cousin", lastName: "", position: "Forward", nationality: "Belgium", dateOfBirth: "1993-07-12", height: "1.81m", joinDate: "2021-01-20", imageUrl: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 11, firstName: "Gus", lastName: "", position: "Midfielder", nationality: "Sweden", dateOfBirth: "1993-11-08", height: "1.80m", joinDate: "2020-09-01", imageUrl: "https://images.unsplash.com/photo-1594736797933-d0c6b3935a1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
      { jerseyNumber: 12, firstName: "Stefan", lastName: "", position: "Goalkeeper", nationality: "Croatia", dateOfBirth: "1994-08-22", height: "1.88m", joinDate: "2023-01-15", imageUrl: "https://images.unsplash.com/photo-1591013355309-db8ec65ca384?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600", isActive: true },
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
      const goals = playerData.position === "Forward" ? Math.floor(Math.random() * 20) : playerData.position === "Midfielder" ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 3);
      const assists = Math.floor(Math.random() * 15);
      const possessionWon = Math.floor(Math.random() * 50) + 10;
      const possessionLost = Math.floor(Math.random() * 40) + 5;
      
      const stats: PlayerStats = {
        id: statsId,
        playerId: id,
        season: "2024-25",
        createdAt: new Date(),
        
        // Basic stats - FC 25 Pro Clubs
        appearance: Math.floor(Math.random() * 25) + 1,
        motm: Math.floor(Math.random() * 5),
        goals: goals,
        assists: assists,
        avgRating: Math.floor(Math.random() * 30) + 60, // 6.0-9.0 rating (stored as 60-90)
        
        // Shooting stats
        shots: Math.floor(Math.random() * 50) + 10,
        shotAccuracy: Math.floor(Math.random() * 60) + 20, // 20-80%
        
        // Passing stats
        passes: Math.floor(Math.random() * 500) + 100,
        passAccuracy: Math.floor(Math.random() * 30) + 65, // 65-95%
        
        // Dribbling stats
        dribbles: Math.floor(Math.random() * 30) + 5,
        dribbleSuccessRate: Math.floor(Math.random() * 40) + 50, // 50-90%
        
        // Defensive stats
        tackles: Math.floor(Math.random() * 40) + 5,
        tackleSuccessRate: Math.floor(Math.random() * 50) + 40, // 40-90%
        
        // Disciplinary stats
        offsides: Math.floor(Math.random() * 8),
        foulsCommitted: Math.floor(Math.random() * 15),
        
        // Possession stats
        possessionWon: possessionWon,
        possessionLost: possessionLost,
        possessionDifference: possessionWon - possessionLost,
        
        // Time and distance stats
        minutesPlayed: Math.floor(Math.random() * 2000) + 500,
        distanceCovered: Math.floor(Math.random() * 5000) + 8000, // 8-13km in meters
        distanceSprinted: Math.floor(Math.random() * 2000) + 1000, // 1-3km in meters
        
        // Goalkeeping stats
        saves: playerData.position === "Goalkeeper" ? Math.floor(Math.random() * 100) + 20 : Math.floor(Math.random() * 5),
        pkSave: playerData.position === "Goalkeeper" ? Math.floor(Math.random() * 3) : 0,
        cleanSheet: playerData.position === "Goalkeeper" ? Math.floor(Math.random() * 15) : 0,
        
        // Card stats
        yellowCards: Math.floor(Math.random() * 8),
        redCards: Math.floor(Math.random() * 2),
        
        // Legacy fields for backwards compatibility
        gamesPlayed: Math.floor(Math.random() * 25) + 1,
        minutes: Math.floor(Math.random() * 2000) + 500,
        starts: Math.floor(Math.random() * 20) + 5,
        substituteOn: Math.floor(Math.random() * 5),
        substituteOff: Math.floor(Math.random() * 10),
        leftFootedGoals: Math.floor(Math.random() * 5),
        rightFootedGoals: Math.floor(Math.random() * 8),
        headedGoals: Math.floor(Math.random() * 3),
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
