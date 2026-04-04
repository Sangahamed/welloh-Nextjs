import { useState } from "react";
import { useGetProfile, useUpdateProfile, useGetPortfolioSummary } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { User, TrendingUp, DollarSign, BarChart2, Edit2, Check, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Profile() {
  const { user } = useUser();
  const { data: profile, isLoading } = useGetProfile();
  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummary();
  const { mutate: updateProfile, isPending } = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  function startEdit() {
    setUsername(profile?.username ?? "");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setUsername("");
  }

  function saveEdit() {
    if (!username.trim()) {
      toast({ title: "Username cannot be empty", variant: "destructive" });
      return;
    }
    updateProfile(
      { data: { username: username.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Profile updated!" });
          queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
          setEditing(false);
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err?.message ?? "Unknown error", variant: "destructive" });
        },
      }
    );
  }

  const totalGain = Number(summary?.totalGain ?? 0);
  const totalGainPct = Number(summary?.totalGainPct ?? 0);
  const totalValue = Number(summary?.totalValue ?? 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-1">Your account and trading statistics.</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {user?.firstName?.[0] ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="h-8 w-48 bg-background border-border"
                          autoFocus
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                        />
                        <Button size="sm" variant="ghost" onClick={saveEdit} disabled={isPending}>
                          <Check className="w-4 h-4 text-green-500" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold">{profile?.username ?? user?.username ?? "Trader"}</h2>
                        <Button size="sm" variant="ghost" onClick={startEdit} className="text-muted-foreground">
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm mt-1">{user?.primaryEmailAddress?.emailAddress}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">Simulator Account</Badge>
                    {profile?.rank && <Badge variant="outline">Rank #{profile.rank}</Badge>}
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                  <DollarSign className="w-4 h-4" /> Portfolio Value
                </div>
                <p className="text-2xl font-bold font-mono">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                  <TrendingUp className="w-4 h-4" /> Total Return
                </div>
                <p className={`text-2xl font-bold font-mono ${totalGain >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalGain >= 0 ? "+" : ""}{totalGainPct.toFixed(2)}%
                </p>
                <p className={`text-sm font-mono ${totalGain >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {totalGain >= 0 ? "+" : ""}${totalGain.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                  <DollarSign className="w-4 h-4" /> Cash Balance
                </div>
                <p className="text-2xl font-bold font-mono">${Number(summary?.cashBalance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2 text-muted-foreground text-sm">
                  <BarChart2 className="w-4 h-4" /> Open Positions
                </div>
                <p className="text-2xl font-bold font-mono">{summary?.holdings?.length ?? 0}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Account Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Starting Capital</span>
            <span className="font-mono font-semibold">$100,000.00</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Account Type</span>
            <span className="font-semibold">Simulated Trading</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/50">
            <span className="text-muted-foreground text-sm">Member Since</span>
            <span className="font-semibold">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "—"}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
