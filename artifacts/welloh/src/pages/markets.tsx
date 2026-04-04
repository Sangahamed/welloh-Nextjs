import { useState } from "react";
import { useSearchStocks, useGetMarketOverview } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { Link } from "wouter";

const EXCHANGES = ["All", "NYSE", "NASDAQ", "BRVM", "JSE", "NSE", "EGX"];

export default function Markets() {
  const [query, setQuery] = useState("");
  const [exchange, setExchange] = useState("All");

  const { data: stocks, isLoading } = useSearchStocks({
    q: query || undefined,
    exchange: exchange === "All" ? undefined : exchange,
    limit: 50,
  });
  const { data: indices, isLoading: indicesLoading } = useGetMarketOverview();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Markets</h1>
        <p className="text-muted-foreground mt-1">Browse global stocks across 6 exchanges including African markets.</p>
      </div>

      {/* Market Indices Bar */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {indicesLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
          : indices?.map((idx) => {
              const changePct = Number(idx.changePct);
              return (
                <Card key={idx.name} className="bg-card border-border">
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground truncate">{idx.name}</p>
                    <p className="font-bold font-mono mt-1">{Number(idx.value).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                    <p className={`text-xs font-semibold mt-1 ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks by ticker or name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        <Select value={exchange} onValueChange={setExchange}>
          <SelectTrigger className="w-40 bg-card border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXCHANGES.map((ex) => (
              <SelectItem key={ex} value={ex}>{ex}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stocks Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            {stocks?.length ?? 0} stocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left pb-3 font-medium">Symbol</th>
                    <th className="text-left pb-3 font-medium hidden sm:table-cell">Company</th>
                    <th className="text-left pb-3 font-medium hidden md:table-cell">Exchange</th>
                    <th className="text-right pb-3 font-medium">Price</th>
                    <th className="text-right pb-3 font-medium">Change</th>
                    <th className="text-right pb-3 font-medium hidden lg:table-cell">Volume</th>
                    <th className="text-right pb-3 font-medium hidden xl:table-cell">Mkt Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks?.map((stock) => {
                    const changePct = Number(stock.changePct);
                    return (
                      <tr key={`${stock.exchange}-${stock.ticker}`} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer">
                        <td className="py-3">
                          <Link href={`/stock/${stock.exchange}/${stock.ticker}`} className="flex items-center gap-2">
                            <span className="font-bold text-primary hover:underline">{stock.ticker}</span>
                          </Link>
                        </td>
                        <td className="py-3 text-muted-foreground hidden sm:table-cell">{stock.name}</td>
                        <td className="py-3 hidden md:table-cell">
                          <Badge variant="outline" className="text-xs">{stock.exchange}</Badge>
                        </td>
                        <td className="py-3 text-right font-mono font-semibold">
                          {stock.currency === "USD" ? "$" : ""}{Number(stock.price).toFixed(2)} {stock.currency !== "USD" ? stock.currency : ""}
                        </td>
                        <td className={`py-3 text-right font-mono font-semibold ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
                          <span className="flex items-center justify-end gap-1">
                            {changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                          </span>
                        </td>
                        <td className="py-3 text-right text-muted-foreground font-mono hidden lg:table-cell">
                          {Number(stock.volume ?? 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-right text-muted-foreground font-mono hidden xl:table-cell">
                          {stock.marketCap ? `$${(Number(stock.marketCap) / 1e9).toFixed(1)}B` : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
