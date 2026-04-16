"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/clerk-react";
import { Shield, Users, Settings, BarChart3, Download, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const twoFactorEnabled = (user as any)?.secondFactors?.includes('totp') || false;

  // Mock data - in real app, fetch from API
  const stats = {
    totalUsers: 1250,
    activeUsers: 892,
    totalPredictions: 456,
    pendingReports: 12,
  };

  if (!isSignedIn || user?.publicMetadata?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Access Denied</h1>
          <p className="text-muted-foreground">Administrator access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Admin Dashboard</h1>
        <p className="text-cyan-200">Manage platform settings and monitor system health.</p>
      </div>

      {/* Security Settings */}
      <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20 card-3d glow-cyan">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-cyan">
            <Shield className="w-5 h-5" />
            Security Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa" className="text-cyan-200">Two-Factor Authentication (2FA)</Label>
              <p className="text-sm text-cyan-300">TOTP-based 2FA status for your account</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={twoFactorEnabled ? "default" : "secondary"} className={twoFactorEnabled ? "bg-green-500 text-black" : ""}>
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
              <Switch
                id="2fa"
                checked={twoFactorEnabled}
                disabled
              />
            </div>
          </div>
          {!twoFactorEnabled && (
            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-cyan-200 mb-2">2FA Not Enabled</p>
              <p className="text-sm text-cyan-300 mb-4">
                Enable 2FA in your account settings for enhanced security.
              </p>
              <Button className="bg-cyan-500 hover:bg-cyan-400 text-black" onClick={() => window.location.href = '/account'}>
                Go to Account Settings
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20 glow-cyan">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">Total Users</p>
                <p className="text-2xl font-bold neon-cyan">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 backdrop-blur-sm border-green-500/20 glow-green">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Active Users</p>
                <p className="text-2xl font-bold neon-green">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 backdrop-blur-sm border-purple-500/20 glow-purple">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Predictions</p>
                <p className="text-2xl font-bold neon-purple">{stats.totalPredictions.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/50 backdrop-blur-sm border-red-500/20 glow-red">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300">Pending Reports</p>
                <p className="text-2xl font-bold neon-red">{stats.pendingReports}</p>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RGPD Compliance */}
      <Card className="bg-black/50 backdrop-blur-sm border-green-500/20 card-3d glow-green">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-green">
            <Shield className="w-5 h-5" />
            RGPD Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button className="bg-green-500 hover:bg-green-400 text-black glow-green">
              <Download className="w-4 h-4 mr-2" />
              Export User Data
            </Button>
            <Button variant="destructive" className="bg-red-500 hover:bg-red-400 glow-red">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete User Data
            </Button>
          </div>
          <p className="text-sm text-green-300">
            Export all user data in JSON format or permanently delete user account and associated data.
          </p>
        </CardContent>
      </Card>

      {/* System Configuration */}
      <Card className="bg-black/50 backdrop-blur-sm border-magenta-500/20 card-3d glow-magenta">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 neon-magenta">
            <Settings className="w-5 h-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-magenta-200">Maintenance Mode</Label>
              <p className="text-sm text-magenta-300 mb-2">Temporarily disable user access for maintenance</p>
              <Switch />
            </div>
            <div>
              <Label className="text-magenta-200">Email Notifications</Label>
              <p className="text-sm text-magenta-300 mb-2">Enable system-wide email notifications</p>
              <Switch defaultChecked />
            </div>
            <div>
              <Label className="text-magenta-200">Prediction Moderation</Label>
              <p className="text-sm text-magenta-300 mb-2">Require admin approval for new predictions</p>
              <Switch />
            </div>
            <div>
              <Label className="text-magenta-200">Analytics Tracking</Label>
              <p className="text-sm text-magenta-300 mb-2">Collect anonymous usage analytics</p>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}