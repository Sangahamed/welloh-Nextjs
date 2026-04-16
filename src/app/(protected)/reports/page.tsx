"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, FileText, BarChart3, Clock } from "lucide-react";

interface Report {
  id: string;
  name: string;
  type: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  schedule: string;
  lastRun: string;
  nextRun: string;
}

const mockReports: Report[] = [
  {
    id: '1',
    name: 'Weekly User Activity Report',
    type: 'User Analytics',
    status: 'completed',
    schedule: 'Weekly (Monday 9:00 AM)',
    lastRun: '2024-01-15 09:00:00',
    nextRun: '2024-01-22 09:00:00'
  },
  {
    id: '2',
    name: 'Monthly Trading Performance',
    type: 'Trading Analytics',
    status: 'running',
    schedule: 'Monthly (1st of month)',
    lastRun: '2024-01-01 00:00:00',
    nextRun: '2024-02-01 00:00:00'
  },
  {
    id: '3',
    name: 'System Health Summary',
    type: 'System Monitoring',
    status: 'scheduled',
    schedule: 'Daily (6:00 AM)',
    lastRun: '2024-01-16 06:00:00',
    nextRun: '2024-01-17 06:00:00'
  }
];

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState('all');

  const filteredReports = selectedType === 'all'
    ? mockReports
    : mockReports.filter(r => r.type.toLowerCase().includes(selectedType.toLowerCase()));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'running': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'scheduled': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'failed': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Reports & Analytics</h1>
        <p className="text-cyan-200">Automated reports and scheduled analytics.</p>
      </div>

      {/* Controls */}
      <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 bg-black/50 border-cyan-500/20 text-cyan-100">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-black/80 border-cyan-500/20">
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="user">User Analytics</SelectItem>
                  <SelectItem value="trading">Trading Analytics</SelectItem>
                  <SelectItem value="system">System Monitoring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black glow-cyan">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule New Report
              </Button>
              <Button variant="outline" className="border-cyan-500 text-cyan-400 hover:bg-cyan-500/10">
                <Download className="w-4 h-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="bg-black/50 backdrop-blur-sm border-magenta-500/20 card-3d glow-magenta">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-magenta-400" />
                    <h3 className="text-lg font-semibold neon-magenta">{report.name}</h3>
                    <Badge variant="secondary" className="bg-magenta-500/20 text-magenta-200 border-magenta-500/30">
                      {report.type}
                    </Badge>
                  </div>
                  <p className="text-magenta-200 mb-4">{report.schedule}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-magenta-300">Last Run:</span>
                      <p className="text-magenta-100">{report.lastRun}</p>
                    </div>
                    <div>
                      <span className="text-magenta-300">Next Run:</span>
                      <p className="text-magenta-100">{report.nextRun}</p>
                    </div>
                    <div>
                      <span className="text-magenta-300">Status:</span>
                      <Badge className={`${getStatusColor(report.status)} mt-1`}>
                        {report.status === 'running' && <Clock className="w-3 h-3 mr-1 animate-spin" />}
                        {report.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button size="sm" variant="outline" className="border-magenta-500 text-magenta-400 hover:bg-magenta-500/10">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="border-magenta-500 text-magenta-400 hover:bg-magenta-500/10">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Templates */}
      <Card className="bg-black/50 backdrop-blur-sm border-yellow-500/20 card-3d glow-yellow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-yellow">
            <FileText className="w-5 h-5" />
            Available Report Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              'User Registration Trends',
              'Trading Volume Analysis',
              'Performance Leaderboard',
              'Market Sentiment Report',
              'Risk Assessment Summary',
              'Revenue Analytics'
            ].map((template) => (
              <div key={template} className="p-4 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/5 transition-colors cursor-pointer">
                <h4 className="font-semibold text-yellow-200 mb-2">{template}</h4>
                <Button size="sm" className="w-full bg-yellow-500 hover:bg-yellow-400 text-black">
                  Schedule Report
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}