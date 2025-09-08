// This file contains mock data for development purposes
// In production, this would be replaced with real API calls

export const mockPlayers = [
  {
    id: "1",
    jerseyNumber: 1,
    firstName: "David",
    lastName: "Rodriguez",
    position: "Goalkeeper",
    nationality: "Spain",
    dateOfBirth: "1992-03-15",
    height: "1.90m",
    joinDate: "2022-07-01",
    imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
  },
  {
    id: "2",
    jerseyNumber: 9,
    firstName: "Marcus",
    lastName: "Thompson",
    position: "Forward",
    nationality: "England",
    dateOfBirth: "1995-03-15",
    height: "1.83m",
    joinDate: "2022-07-01",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
  },
  // Add more mock players as needed
];

export const mockMatches = [
  {
    id: "1",
    homeTeam: "AFC Richman",
    awayTeam: "Chelsea FC",
    homeTeamLogo: "AFC",
    awayTeamLogo: "CHE",
    homeScore: 3,
    awayScore: 1,
    competition: "Premier League",
    matchDate: "2024-12-15T15:30:00",
    venue: "Richman Stadium",
    status: "FT",
  },
  {
    id: "2",
    homeTeam: "Liverpool FC",
    awayTeam: "AFC Richman",
    homeTeamLogo: "LIV",
    awayTeamLogo: "AFC",
    homeScore: null,
    awayScore: null,
    competition: "Champions League",
    matchDate: "2024-12-22T20:00:00",
    venue: "Anfield",
    status: "Upcoming",
  },
];
