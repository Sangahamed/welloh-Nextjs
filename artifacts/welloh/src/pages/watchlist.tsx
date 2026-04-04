import { useGetWatchlist, useRemoveFromWatchlist, useGetStockQuote } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, TrendingUp, TrendingDown, Trash2, Plus } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

function WatchlistRow({ item }: { item: any }) {
  const { data: quote, isLoading } = useGetStockQuote({ ticker: item.ticker, exchange: item.exchange });
  const { mutate: remove } = useRemoveFromWatchlist();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const changePct = Number(quote?.changePct ?? 0);

  function handleRemove() {
    remove(
      { id: item.id },
      {
        onSuccess: () => {
          toast({ title: `${item.ticker} removed from watchlist` });
          queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
        },
      }
    );
  }

  return (
    <tr className="border-b border-border/50 hover:bg-accent/30 transition-colors group">
      <td className="py-3">
        <Link href={`/stock/${item.exchange}/${item.ticker}`} className="font-bold text-primary hover:underline">{item.ticker}</Link>
        <span className="ml-2 text-xs text-muted-foreground">{item.exchange}</span>
      </td>
      <td className="py-3 text-muted-foreground hidden sm:table-cell">
        {isLoading ? <Skeleton className="h-4 w-32" /> : quote?.name ?? "—"}
      </td>
      <td className="py-3 text-right font-mono font-semibold">
        {isLoading ? <Skeleton className="h-4 w-16 ml-auto" /> : quote ? `$${Number(quote.price).toFixed(2)}` : "—"}
      </td>
      <td className="py-3 text-right">
        {isLoading ? <Skeleton className="h-4 w-16 ml-auto" /> : quote ? (
          <span className={`flex items-center justify-end gap-1 font-mono font-semibold text-sm ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
            {changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
          </span>
        ) : "—"}
      </td>
      <td className="py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link href={`/stock/${item.exchange}/${item.ticker}`}>
            <Button variant="ghost" size="sm">Trade</Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function Watchlist() {
  const { data: watchlist, isLoading } = useGetWatchlist();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Watchlist</h1>
        <p className="text-muted-foreground mt-1">Track stocks you're interested in.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            {watchlist?.length ?? 0} watching
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : !watchlist || watchlist.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Your watchlist is empty.</p>
              <Link href="/markets">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" /> Add stocks from Markets
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">Symbol</th>
                    <th className="text-left pb-3 font-medium hidden sm:table-cell">Company</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Change</th>
                    <th className="text-right pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {watchlist.map((item: any) => (
                    <WatchlistRow key={`${item.exchange}-${item.ticker}`} item={item} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
