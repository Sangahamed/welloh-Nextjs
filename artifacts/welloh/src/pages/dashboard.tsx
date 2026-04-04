import { useGetPortfolioSummary, useGetMarketOverview, useGetLeaderboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, BarChart2, Trophy, Globe } from "lucide-react";
import { Link } from "wouter";

function StatCard({ title, value, sub, icon: Icon, trend }: { title: string; value: string; sub?: string; icon: any; trend?: number }) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-sm font-medium ${trend >= 0 ? "text-green-500" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {trend >= 0 ? "+" : ""}{trend.toFixed(2)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useGetPortfolioSummary();
  const { data: indices, isLoading: indicesLoading } = useGetMarketOverview();
  const { data: leaders, isLoading: leadersLoading } = useGetLeaderboard({ limit: 5 });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back. Here's your portfolio overview.</p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : summary ? (
          <>
            <StatCard title="Total Value" value={`$${Number(summary.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} trend={Number(summary.totalGainPct)} />
            <StatCard title="Cash Balance" value={`$${Number(summary.cashBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} sub="Available to invest" icon={DollarSign} />
            <StatCard title="Total P&L" value={`${Number(summary.totalGain) >= 0 ? "+" : ""}$${Number(summary.totalGain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={BarChart2} trend={Number(summary.totalGainPct)} />
            <StatCard title="Positions" value={String(summary.holdings?.length ?? 0)} sub="Open positions" icon={Globe} />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Market Indices */}
        <Card className="xl:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Market Indices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {indicesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {indices?.map((idx) => {
                  const changePct = Number(idx.changePct);
                  return (
                    <div key={idx.name} className="flex justify-between items-center rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-semibold text-sm">{idx.name}</p>
                        <p className="text-xs text-muted-foreground">{idx.exchange}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-semibold text-sm">{Number(idx.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                        <p className={`text-xs font-medium ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leadersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <div className="space-y-2">
                {leaders?.map((entry, i) => (
                  <div key={entry.username} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors">
                    <span className={`text-sm font-bold w-5 text-center ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{entry.username}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {Number(entry.returnPct) >= 0 ? "+" : ""}{Number(entry.returnPct).toFixed(1)}%
                    </Badge>
                  </div>
                ))}
                <Link href="/leaderboard" className="block text-center text-xs text-primary hover:underline mt-3">View full leaderboard →</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holdings */}
      {summary?.holdings && summary.holdings.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Your Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">Symbol</th>
                    <th className="text-right pb-3 font-medium">Shares</th>
                    <th className="text-right pb-3 font-medium">Avg Cost</th>
                    <th className="text-right pb-3 font-medium">Current</th>
                    <th className="text-right pb-3 font-medium">Value</th>
                    <th className="text-right pb-3 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.holdings.map((h: any) => {
                    const gainPct = Number(h.gainPct);
                    return (
                      <tr key={`${h.exchange}-${h.ticker}`} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                        <td className="py-3">
                          <Link href={`/stock/${h.exchange}/${h.ticker}`} className="font-bold text-primary hover:underline">{h.ticker}</Link>
                          <span className="ml-2 text-xs text-muted-foreground">{h.exchange}</span>
                        </td>
                        <td className="py-3 text-right font-mono">{Number(h.quantity).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">${Number(h.averageCost).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">${Number(h.currentPrice).toFixed(2)}</td>
                        <td className="py-3 text-right font-mono">${Number(h.currentValue).toFixed(2)}</td>
                        <td className={`py-3 text-right font-mono font-semibold ${gainPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {gainPct >= 0 ? "+" : ""}{gainPct.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
