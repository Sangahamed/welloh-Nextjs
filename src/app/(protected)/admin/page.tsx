"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Users, Settings, BarChart3, Download, Trash2 } from "lucide-react";

export default function AdminDashboard() {
  const { currentUser, currentUserAccount } = useAuth();

  const stats = {
    totalUsers: 1250,
    activeUsers: 892,
    totalPredictions: 456,
    pendingReports: 12,
  };

  // Vérification d'accès via Supabase auth (pas Clerk)
  if (!currentUser || currentUserAccount?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-500 mb-2">Accès refusé</h1>
          <p className="text-muted-foreground">Accès administrateur requis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan mb-2">Admin Dashboard</h1>
        <p className="text-cyan-200">Gérez les paramètres de la plateforme.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/50 backdrop-blur-sm border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">Utilisateurs</p>
                <p className="text-2xl font-bold text-cyan-400">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-300">Actifs</p>
                <p className="text-2xl font-bold text-green-400">{stats.activeUsers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-300">Prédictions</p>
                <p className="text-2xl font-bold text-purple-400">{stats.totalPredictions.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-black/50 backdrop-blur-sm border-red-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-300">Signalements</p>
                <p className="text-2xl font-bold text-red-400">{stats.pendingReports}</p>
              </div>
              <Shield className="w-8 h-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/50 backdrop-blur-sm border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Shield className="w-5 h-5" />
            Conformité RGPD
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button className="bg-green-500 hover:bg-green-400 text-black">
              <Download className="w-4 h-4 mr-2" />
              Exporter données utilisateur
            </Button>
            <Button variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer données utilisateur
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-black/50 backdrop-blur-sm border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Settings className="w-5 h-5" />
            Configuration système
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-purple-200">Mode maintenance</Label>
              <p className="text-sm text-purple-300 mb-2">Désactiver temporairement l'accès</p>
              <Switch />
            </div>
            <div>
              <Label className="text-purple-200">Modération prédictions</Label>
              <p className="text-sm text-purple-300 mb-2">Approbation admin requise</p>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}