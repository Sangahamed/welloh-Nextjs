import { useState } from "react";
import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, TrendingDown, Medal } from "lucide-react";

const PERIODS = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "This Week", value: "week" },
];

export default function Leaderboard() {
  const [period, setPeriod] = useState("all");
  const { data: entries, isLoading } = useGetLeaderboard({ limit: 50 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Top traders ranked by portfolio return.</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Top 3 Podium */}
      {!isLoading && entries && entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-2">
          {/* 2nd Place */}
          <Card className="bg-card border-border col-start-1">
            <CardContent className="pt-6 text-center">
              <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-400">#2</p>
              <p className="font-semibold mt-1 truncate">{entries[1]?.username}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${Number(entries[1]?.returnPct) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Number(entries[1]?.returnPct) >= 0 ? "+" : ""}{Number(entries[1]?.returnPct).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          {/* 1st Place */}
          <Card className="bg-yellow-500/5 border-yellow-500/30 col-start-2 -mt-4">
            <CardContent className="pt-6 text-center">
              <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-500">#1</p>
              <p className="font-semibold mt-1 truncate">{entries[0]?.username}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${Number(entries[0]?.returnPct) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Number(entries[0]?.returnPct) >= 0 ? "+" : ""}{Number(entries[0]?.returnPct).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
          {/* 3rd Place */}
          <Card className="bg-card border-border col-start-3">
            <CardContent className="pt-6 text-center">
              <Medal className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">#3</p>
              <p className="font-semibold mt-1 truncate">{entries[2]?.username}</p>
              <p className={`text-lg font-bold font-mono mt-1 ${Number(entries[2]?.returnPct) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {Number(entries[2]?.returnPct) >= 0 ? "+" : ""}{Number(entries[2]?.returnPct).toFixed(2)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Rankings */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">Rank</th>
                    <th className="text-left pb-3 font-medium">Trader</th>
                    <th className="text-right pb-3 font-medium">Portfolio Value</th>
                    <th className="text-right pb-3 font-medium">Return</th>
                    <th className="text-right pb-3 font-medium hidden sm:table-cell">Sharpe</th>
                    <th className="text-right pb-3 font-medium hidden md:table-cell">Trades</th>
                  </tr>
                </thead>
                <tbody>
                  {entries?.map((entry, i) => {
                    const returnPct = Number(entry.returnPct);
                    return (
                      <tr key={entry.username} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-3">
                          <span className={`font-bold text-lg ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="py-3">
                          <p className="font-semibold">{entry.username}</p>
                        </td>
                        <td className="py-3 text-right font-mono">
                          ${Number(entry.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`flex items-center justify-end gap-1 font-mono font-semibold ${returnPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {returnPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground font-mono hidden sm:table-cell">
                          {entry.sharpeRatio ? Number(entry.sharpeRatio).toFixed(2) : "—"}
                        </td>
                        <td className="py-3 text-right text-muted-foreground hidden md:table-cell">
                          {entry.tradeCount ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {entries?.length === 0 && (
                <p className="text-center text-muted-foreground py-12">No traders yet. Start trading to appear on the leaderboard!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
