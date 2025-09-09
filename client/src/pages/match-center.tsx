import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Play, Users, Tv, ExternalLink } from "lucide-react";
import type { Match, Player } from "@shared/schema";
import { format } from "date-fns";
import FormationPitch from "@/components/FormationPitch";

export default function MatchCenterPage() {
  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: players = [] } = useQuery<Player[]>({
    queryKey: ["/api/players"],
    queryFn: async () => {
      const response = await fetch("/api/players");
      if (!response.ok) throw new Error("Failed to fetch players");
      return response.json();
    },
  });

  // Get the next upcoming match
  const nextMatch = matches
    .filter(match => match.status === "Upcoming" || match.status === "Live")
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];

  // Get recent matches
  const recentMatches = matches
    .filter(match => match.status === "FT")
    .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-900 via-red-800 to-red-700 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">Match Center</h1>
            <p className="text-xl text-red-100">
              Live coverage, match highlights, and upcoming fixtures
            </p>
          </div>

          {/* Next Match Spotlight */}
          {nextMatch && (
            <div className="max-w-4xl mx-auto">
              <Card className="bg-white/10 border-white/20 text-white">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl text-white mb-2">
                    {nextMatch.status === "Live" ? "🔴 LIVE NOW" : "Next Match"}
                  </CardTitle>
                  <div className="flex justify-center items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(nextMatch.matchDate), "EEEE, MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(nextMatch.matchDate), "h:mm a")}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="text-center flex-1">
                      <div className="flex justify-center items-center gap-3 mb-2">
                        {nextMatch.homeTeamLogo && (
                          <img 
                            src={nextMatch.homeTeamLogo} 
                            alt={nextMatch.homeTeam} 
                            className="w-16 h-16 object-contain"
                          />
                        )}
                        <div>
                          <div className="text-2xl font-bold">{nextMatch.homeTeam}</div>
                          {nextMatch.homeTeam === "AFC Richman" && (
                            <Badge className="bg-red-600">HOME</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* VS or Score */}
                    <div className="text-center px-8">
                      {nextMatch.status === "Live" ? (
                        <div className="text-4xl font-bold text-red-400 animate-pulse">
                          LIVE
                        </div>
                      ) : nextMatch.status === "FT" && nextMatch.homeScore !== undefined && nextMatch.awayScore !== undefined ? (
                        <div className="text-4xl font-bold">
                          {nextMatch.homeScore} - {nextMatch.awayScore}
                        </div>
                      ) : (
                        <div className="text-4xl font-bold">
                          VS
                        </div>
                      )}
                      <div className="text-sm mt-2">
                        <Badge variant="outline" className="text-white border-white">
                          {nextMatch.competition}
                        </Badge>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center flex-1">
                      <div className="flex justify-center items-center gap-3 mb-2">
                        <div>
                          <div className="text-2xl font-bold">{nextMatch.awayTeam}</div>
                          {nextMatch.awayTeam === "AFC Richman" && (
                            <Badge className="bg-red-600">AWAY</Badge>
                          )}
                        </div>
                        {nextMatch.awayTeamLogo && (
                          <img 
                            src={nextMatch.awayTeamLogo} 
                            alt={nextMatch.awayTeam} 
                            className="w-16 h-16 object-contain"
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  {nextMatch.status === "Upcoming" && (
                    <div className="mt-6 text-center">
                      <MatchCountdown matchDate={new Date(nextMatch.matchDate)} />
                    </div>
                  )}

                  {/* Live Stream Button */}
                  {nextMatch.replayUrl && (
                    <div className="mt-6 text-center">
                      <Button
                        asChild
                        className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                        data-testid="live-stream-button"
                      >
                        <a href={nextMatch.replayUrl} target="_blank" rel="noopener noreferrer">
                          <Tv className="w-5 h-5 mr-2" />
                          {nextMatch.status === "Live" ? "Watch Live" : "Set Reminder"}
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Stream Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tv className="w-5 h-5 text-red-500" />
                  Live Stream & Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center text-gray-400">
                    <Tv className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-semibold mb-2">Stream Currently Offline</p>
                    <p>Check back during match time for live coverage</p>
                    <div className="mt-4">
                      <Button variant="outline" asChild data-testid="twitch-channel-button">
                        <a href="https://twitch.tv/sevlakev" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visit Twitch Channel
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>🔴 Live matches streamed on Twitch</p>
                  <p>📺 Match highlights available after each game</p>
                  <p>🎥 Post-match analysis and player interviews</p>
                </div>
              </CardContent>
            </Card>

            {/* Match Statistics */}
            {nextMatch && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-500" />
                    Match Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-3">
                        {nextMatch.homeTeam === "AFC Richman" ? "AFC Richman" : nextMatch.homeTeam}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recent Form:</span>
                          <span className="font-mono">W-W-D-L-W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goals Scored:</span>
                          <span>12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goals Conceded:</span>
                          <span>8</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-3">
                        {nextMatch.awayTeam === "AFC Richman" ? "AFC Richman" : nextMatch.awayTeam}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recent Form:</span>
                          <span className="font-mono">L-W-W-D-W</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goals Scored:</span>
                          <span>9</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Goals Conceded:</span>
                          <span>11</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Match Facts</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• This will be the teams' {Math.floor(Math.random() * 5) + 3}rd meeting this season</li>
                      <li>• AFC Richman has won {Math.floor(Math.random() * 3) + 2} of the last 5 encounters</li>
                      <li>• Average goals per game between these teams: {(Math.random() * 2 + 2).toFixed(1)}</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lineup Section */}
            {nextMatch && 
             nextMatch.homeTeam.toLowerCase().includes("richman") && 
             nextMatch.formation && 
             nextMatch.lineup && 
             Object.keys(nextMatch.lineup).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-red-500" />
                    Starting Lineup
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Formation: {nextMatch.formation}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <FormationPitch
                    selectedFormation={nextMatch.formation}
                    lineup={nextMatch.lineup as Record<string, string>}
                    players={players}
                    isEditing={false}
                    className="max-w-md mx-auto"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Results</CardTitle>
              </CardHeader>
              <CardContent>
                {recentMatches.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No recent matches
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentMatches.map((match) => (
                      <Link key={match.id} href={`/match/${match.id}`}>
                        <div className="p-4 bg-muted hover:bg-muted/80 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-border">
                          {/* Competition Badge */}
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="outline" className="text-xs">
                              {match.competition}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              FT
                            </Badge>
                          </div>
                          
                          {/* Teams and Score */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 text-center">
                              <div className="font-semibold text-sm mb-1">
                                {match.homeTeam}
                              </div>
                            </div>
                            
                            <div className="px-4 text-center">
                              <div className="font-bold text-lg">
                                {match.homeScore} - {match.awayScore}
                              </div>
                            </div>
                            
                            <div className="flex-1 text-center">
                              <div className="font-semibold text-sm mb-1">
                                {match.awayTeam}
                              </div>
                            </div>
                          </div>
                          
                          {/* Date */}
                          <div className="text-center mt-2">
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(match.matchDate), "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/matches" data-testid="all-matches-link">
                    <Calendar className="w-4 h-4 mr-2" />
                    View All Matches
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/squad" data-testid="squad-link">
                    <Users className="w-4 h-4 mr-2" />
                    Squad Overview
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/statistics" data-testid="stats-link">
                    <Users className="w-4 h-4 mr-2" />
                    Player Statistics
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://twitch.tv/sevlakev" target="_blank" rel="noopener noreferrer" data-testid="twitch-link">
                    <Tv className="w-4 h-4 mr-2" />
                    Follow on Twitch
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCountdown({ matchDate }: { matchDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const matchTime = matchDate.getTime();
      const difference = matchTime - now;

      if (difference > 0) {
        setTimeLeft({
          total: difference,
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [matchDate]);

  if (timeLeft.total <= 0) {
    return (
      <div className="text-center">
        <div className="text-2xl font-bold text-red-400">Match Started!</div>
      </div>
    );
  }

  return (
    <div className="text-center" data-testid="match-countdown">
      <div className="text-lg text-red-100 mb-4">Kickoff in:</div>
      <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-3xl font-bold text-white">{timeLeft.days}</div>
          <div className="text-xs text-red-100 uppercase">Days</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-3xl font-bold text-white">{timeLeft.hours}</div>
          <div className="text-xs text-red-100 uppercase">Hours</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-3xl font-bold text-white">{timeLeft.minutes}</div>
          <div className="text-xs text-red-100 uppercase">Minutes</div>
        </div>
        <div className="bg-white/20 rounded-lg p-3">
          <div className="text-3xl font-bold text-white">{timeLeft.seconds}</div>
          <div className="text-xs text-red-100 uppercase">Seconds</div>
        </div>
      </div>
    </div>
  );
}