"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, Briefcase, TrendingUp, Award } from "lucide-react";

interface Talent {
  id: string;
  name: string;
  skills: string[];
  performance: {
    pnl: number;
    sharpe: number;
    winRate: number;
  };
  experience: string;
  location: string;
  avatar: string;
}

const mockTalents: Talent[] = [
  {
    id: '1',
    name: 'David Wilson',
    skills: ['Technical Analysis', 'Algorithmic Trading', 'Risk Management'],
    performance: { pnl: 245.6, sharpe: 2.1, winRate: 68 },
    experience: '5+ years',
    location: 'New York, USA',
    avatar: '/avatars/david.jpg'
  },
  {
    id: '2',
    name: 'Emma Chen',
    skills: ['Fundamental Analysis', 'Portfolio Management', 'Derivatives'],
    performance: { pnl: 189.3, sharpe: 1.9, winRate: 72 },
    experience: '4+ years',
    location: 'London, UK',
    avatar: '/avatars/emma.jpg'
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    skills: ['Quantitative Trading', 'Machine Learning', 'Crypto'],
    performance: { pnl: 312.8, sharpe: 2.4, winRate: 75 },
    experience: '6+ years',
    location: 'San Francisco, USA',
    avatar: '/avatars/marcus.jpg'
  }
];

export default function RecruitersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const filteredTalents = mockTalents.filter(talent =>
    talent.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedSkills.length === 0 || selectedSkills.some(skill => talent.skills.includes(skill)))
  );

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Talent Portal</h1>
        <p className="text-cyan-200">Discover top trading talent for your organization.</p>
      </div>

      {/* Search and Filters */}
      <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <Input
                placeholder="Search talents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-black/50 border-cyan-500/20 text-cyan-100"
              />
            </div>
            <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Talent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTalents.map((talent) => (
          <Card key={talent.id} className="bg-black/50 backdrop-blur-sm border-green-500/20 card-3d glow-green">
            <CardHeader>
              <div className="flex items-start gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={talent.avatar} />
                  <AvatarFallback className="bg-green-500 text-black font-bold">
                    {talent.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <CardTitle className="neon-green text-lg">{talent.name}</CardTitle>
                  <p className="text-green-300 text-sm">{talent.location}</p>
                  <p className="text-green-200 text-xs">{talent.experience}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Skills */}
                <div>
                  <h4 className="text-green-200 font-semibold mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {talent.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="bg-green-500/20 text-green-200 border-green-500/30 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Performance */}
                <div>
                  <h4 className="text-green-200 font-semibold mb-2">Performance Metrics</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-500/10 p-2 rounded">
                      <div className="text-green-300 text-xs">PnL</div>
                      <div className="text-green-100 font-bold">${talent.performance.pnl}K</div>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded">
                      <div className="text-green-300 text-xs">Sharpe</div>
                      <div className="text-green-100 font-bold">{talent.performance.sharpe}</div>
                    </div>
                    <div className="bg-green-500/10 p-2 rounded">
                      <div className="text-green-300 text-xs">Win Rate</div>
                      <div className="text-green-100 font-bold">{talent.performance.winRate}%</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1 bg-green-500 hover:bg-green-400 text-black glow-green">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button variant="outline" className="border-green-500 text-green-400 hover:bg-green-500/10">
                    <Award className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Premium CTA */}
      <Card className="bg-black/50 backdrop-blur-sm border-yellow-500/20 card-3d glow-yellow">
        <CardContent className="text-center py-8">
          <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold neon-yellow mb-2">Premium Recruitment</h3>
          <p className="text-yellow-200 mb-6 max-w-2xl mx-auto">
            Access advanced analytics, direct messaging, and priority matching
            with our premium recruitment suite.
          </p>
          <Button className="bg-yellow-500 hover:bg-yellow-400 text-black glow-yellow">
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}