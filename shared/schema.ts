import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const players = pgTable("players", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jerseyNumber: integer("jersey_number").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  position: text("position").notNull(), // "Goalkeeper", "Defender", "Midfielder", "Forward"
  nationality: text("nationality").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  height: text("height").notNull(),
  joinDate: text("join_date").notNull(),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const playerStats = pgTable("player_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playerId: varchar("player_id").references(() => players.id).notNull(),
  season: text("season").notNull().default("2024-25"),
  // Basic stats - matching FC 25 Pro Clubs exactly
  appearance: integer("appearance").default(0),
  motm: integer("motm").default(0), // Man of the Match
  goals: integer("goals").default(0),
  assists: integer("assists").default(0),
  avgRating: integer("avg_rating").default(0), // stored as integer (rating * 10)
  
  // Shooting stats
  shots: integer("shots").default(0),
  shotAccuracy: integer("shot_accuracy").default(0), // percentage
  
  // Passing stats  
  passes: integer("passes").default(0),
  passAccuracy: integer("pass_accuracy").default(0), // percentage
  
  // Dribbling stats
  dribbles: integer("dribbles").default(0),
  dribbleSuccessRate: integer("dribble_success_rate").default(0), // percentage
  
  // Defensive stats
  tackles: integer("tackles").default(0),
  tackleSuccessRate: integer("tackle_success_rate").default(0), // percentage
  
  // Disciplinary stats
  offsides: integer("offsides").default(0),
  foulsCommitted: integer("fouls_committed").default(0),
  
  // Possession stats
  possessionWon: integer("possession_won").default(0),
  possessionLost: integer("possession_lost").default(0),
  possessionDifference: integer("possession_difference").default(0), // calculated: won - lost
  
  // Time and distance stats
  minutesPlayed: integer("minutes_played").default(0),
  distanceCovered: integer("distance_covered").default(0), // in meters, divide by 1000 for km
  distanceSprinted: integer("distance_sprinted").default(0), // in meters, divide by 1000 for km
  
  // Goalkeeping stats
  saves: integer("saves").default(0),
  pkSave: integer("pk_save").default(0),
  cleanSheet: integer("clean_sheet").default(0),
  
  // Card stats
  yellowCards: integer("yellow_cards").default(0),
  redCards: integer("red_cards").default(0),
  
  // Legacy fields for backwards compatibility
  gamesPlayed: integer("games_played").default(0),
  minutes: integer("minutes").default(0),
  starts: integer("starts").default(0),
  substituteOn: integer("substitute_on").default(0),
  substituteOff: integer("substitute_off").default(0),
  leftFootedGoals: integer("left_footed_goals").default(0),
  rightFootedGoals: integer("right_footed_goals").default(0),
  headedGoals: integer("headed_goals").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  homeTeamLogo: text("home_team_logo"),
  awayTeamLogo: text("away_team_logo"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  competition: text("competition").notNull(),
  matchDate: timestamp("match_date").notNull(),
  venue: text("venue"),
  status: text("status").notNull(), // "FT", "Upcoming", "Live"
  replayUrl: text("replay_url"), // URL for match replay/highlights
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerStatsSchema = createInsertSchema(playerStats).omit({
  id: true,
  createdAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPlayerStats = z.infer<typeof insertPlayerStatsSchema>;
export type PlayerStats = typeof playerStats.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

export type PlayerWithStats = Player & {
  stats: PlayerStats | null;
};
