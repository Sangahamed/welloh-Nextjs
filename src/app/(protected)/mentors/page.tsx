"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, MessageCircle, Star, Trophy } from "lucide-react";

interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  students: number;
  bio: string;
  avatar: string;
}

const mockMentors: Mentor[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    expertise: ['Technical Analysis', 'Risk Management', 'Portfolio Strategy'],
    rating: 4.9,
    students: 156,
    bio: 'Elite trader with 10+ years experience. Specializes in algorithmic trading.',
    avatar: '/avatars/alice.jpg'
  },
  {
    id: '2',
    name: 'Bob Smith',
    expertise: ['Fundamental Analysis', 'Value Investing', 'Market Psychology'],
    rating: 4.8,
    students: 203,
    bio: 'Warren Buffett inspired value investor. Former hedge fund manager.',
    avatar: '/avatars/bob.jpg'
  },
  {
    id: '3',
    name: 'Carol Davis',
    expertise: ['Cryptocurrency', 'DeFi', 'Blockchain'],
    rating: 4.7,
    students: 89,
    bio: 'Crypto expert since 2017. Built multiple successful DeFi projects.',
    avatar: '/avatars/carol.jpg'
  }
];

export default function MentorsPage() {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Elite Mentors</h1>
        <p className="text-cyan-200">Learn from the best traders in the industry.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockMentors.map((mentor) => (
          <Card key={mentor.id} className="bg-black/50 backdrop-blur-sm border-cyan-500/20 card-3d glow-cyan hover:glow-cyan">
            <CardHeader className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-4">
                <AvatarImage src={mentor.avatar} />
                <AvatarFallback className="bg-cyan-500 text-black font-bold">
                  {mentor.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <CardTitle className="neon-cyan">{mentor.name}</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="text-cyan-200">{mentor.rating}</span>
                <span className="text-cyan-300">•</span>
                <Users className="w-4 h-4 text-cyan-400" />
                <span className="text-cyan-200">{mentor.students} students</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {mentor.expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="bg-cyan-500/20 text-cyan-200 border-cyan-500/30">
                    {skill}
                  </Badge>
                ))}
              </div>
              <p className="text-cyan-100 text-sm mb-4">{mentor.bio}</p>
              <div className="flex gap-2">
                <Button className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact
                </Button>
                <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                  <Trophy className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to action */}
      <Card className="bg-black/50 backdrop-blur-sm border-magenta-500/20 card-3d glow-magenta">
        <CardContent className="text-center py-8">
          <Trophy className="w-16 h-16 text-magenta-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold neon-magenta mb-2">Become a Mentor</h3>
          <p className="text-magenta-200 mb-6 max-w-2xl mx-auto">
            Share your trading expertise and help others succeed. Join our elite mentor program
            and earn rewards while building your reputation.
          </p>
          <Button className="bg-magenta-500 hover:bg-magenta-400 text-white glow-magenta">
            Apply to Become a Mentor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}