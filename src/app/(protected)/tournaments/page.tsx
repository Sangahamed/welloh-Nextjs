"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Users, Clock, Target, Zap, Crown } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  type: 'weekly' | 'monthly' | 'special';
  status: 'upcoming' | 'active' | 'completed';
  participants: number;
  maxParticipants: number;
  prizePool: number;
  duration: string;
  startDate: string;
  endDate: string;
  description: string;
}

const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Weekly Champions Cup',
    type: 'weekly',
    status: 'active',
    participants: 1247,
    maxParticipants: 2000,
    prizePool: 5000,
    duration: '7 days',
    startDate: '2024-01-15',
    endDate: '2024-01-22',
    description: 'Compete for the weekly championship with a $5,000 prize pool!'
  },
  {
    id: '2',
    name: 'Monthly Masters League',
    type: 'monthly',
    status: 'upcoming',
    participants: 0,
    maxParticipants: 5000,
    prizePool: 25000,
    duration: '30 days',
    startDate: '2024-02-01',
    endDate: '2024-02-29',
    description: 'The ultimate monthly challenge with $25,000 in prizes.'
  },
  {
    id: '3',
    name: 'Crypto Trading Showdown',
    type: 'special',
    status: 'completed',
    participants: 892,
    maxParticipants: 1000,
    prizePool: 10000,
    duration: '14 days',
    startDate: '2024-01-01',
    endDate: '2024-01-15',
    description: 'Special crypto-focused tournament with advanced strategies.'
  }
];

export default function TournamentsPage() {
  const [selectedType, setSelectedType] = useState<'all' | 'weekly' | 'monthly' | 'special'>('all');

  const filteredTournaments = selectedType === 'all'
    ? mockTournaments
    : mockTournaments.filter(t => t.type === selectedType);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'upcoming': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'completed': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weekly': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'monthly': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'special': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Trading Tournaments</h1>
        <p className="text-cyan-200">Compete in exciting trading competitions and win prizes!</p>
      </div>

      {/* Filters */}
      <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All Tournaments' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'special', label: 'Special Events' }
            ].map((filter) => (
              <Button
                key={filter.value}
                variant={selectedType === filter.value ? "default" : "outline"}
                onClick={() => setSelectedType(filter.value as any)}
                className={selectedType === filter.value
                  ? "bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan"
                  : "border-cyan-500 text-cyan-400 hover:bg-cyan-500/10"
                }
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="bg-black/50 backdrop-blur-sm border-magenta-500/20 card-3d glow-magenta">
            <CardHeader>
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="neon-magenta text-lg">{tournament.name}</CardTitle>
                <Badge className={getTypeColor(tournament.type)}>
                  {tournament.type}
                </Badge>
              </div>
              <Badge className={getStatusColor(tournament.status)}>
                {tournament.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-magenta-200 text-sm">{tournament.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-magenta-300">Prize Pool</span>
                    <p className="text-magenta-100 font-bold">${tournament.prizePool.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-magenta-300">Duration</span>
                    <p className="text-magenta-100 font-bold">{tournament.duration}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-magenta-300 flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Participants
                    </span>
                    <span className="text-magenta-100">
                      {tournament.participants} / {tournament.maxParticipants}
                    </span>
                  </div>
                  <Progress
                    value={(tournament.participants / tournament.maxParticipants) * 100}
                    className="h-2"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-magenta-500 hover:bg-magenta-400 text-white glow-magenta"
                    disabled={tournament.status === 'completed'}
                  >
                    {tournament.status === 'active' ? 'Join Now' : tournament.status === 'upcoming' ? 'Register' : 'View Results'}
                  </Button>
                  <Button variant="outline" className="border-magenta-500 text-magenta-400 hover:bg-magenta-500/10">
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <Card className="bg-black/50 backdrop-blur-sm border-yellow-500/20 card-3d glow-yellow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-yellow">
            <Trophy className="w-5 h-5" />
            Current Tournament Leaders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { rank: 1, name: 'TradingNinja', pnl: '+$12,450', change: '+2.1%' },
              { rank: 2, name: 'MarketMaster', pnl: '+$11,892', change: '+1.9%' },
              { rank: 3, name: 'CryptoKing', pnl: '+$10,567', change: '+1.7%' },
              { rank: 4, name: 'ValueHunter', pnl: '+$9,234', change: '+1.5%' },
              { rank: 5, name: 'RiskTaker', pnl: '+$8,901', change: '+1.3%' }
            ].map((leader) => (
              <div key={leader.rank} className="flex items-center justify-between p-3 bg-yellow-500/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    leader.rank === 1 ? 'bg-yellow-500 text-black' :
                    leader.rank === 2 ? 'bg-gray-400 text-black' :
                    leader.rank === 3 ? 'bg-amber-600 text-white' :
                    'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {leader.rank}
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-200">{leader.name}</p>
                    <p className="text-sm text-yellow-300">{leader.pnl}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                  {leader.change}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}