"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchStocks, useGetMarketOverview, useGetStockQuote } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Search, Globe, BarChart3, Loader2 } from "lucide-react";
import Link from "next/link";
import GlobalMarketView from "@/components/GlobalMarketView";
import type { MarketIndex } from "@/types/market";

export default function Page() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  // Search stocks - uses the actual API params
  const { data: stocks, isLoading: isLoadingStocks } = useSearchStocks({
    query: query || "A", // Search for stocks starting with A if no query
  });

  // Get market overview for indices
  const { data: indices, isLoading: indicesLoading } = useGetMarketOverview();

  const handleAssetSelect = (asset: MarketIndex) => {
    // Navigate to stock detail page
    router.push(`/stock/${asset.exchange}/${asset.symbol}`);
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-magenta-500/5 pointer-events-none"></div>
      <div className="relative">
        <h1 className="text-3xl font-bold neon-cyan">Markets</h1>
        <p className="text-cyan-200 mt-1">Browse global stocks across 6 exchanges including African markets.</p>
      </div>

      {/* View Tabs */}
      <Tabs defaultValue="global" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-black/50 border-cyan-500/20 glow-cyan">
          <TabsTrigger value="global" className="gap-2">
            <Globe className="w-4 h-4" />
            Global View
          </TabsTrigger>
          <TabsTrigger value="classic" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Classic View
          </TabsTrigger>
        </TabsList>

        {/* Global Market View (Neon 3D UI) */}
        <TabsContent value="global" className="space-y-6">
          <GlobalMarketView onAssetSelect={handleAssetSelect} />
        </TabsContent>

        {/* Classic Market View */}
        <TabsContent value="classic" className="space-y-6">
          {/* Market Indices Bar */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Market Indices</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {indicesLoading
                ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
                : indices?.map((idx: any) => {
                    const changePct = Number(idx.changePct);
                    return (
                      <Card key={idx.name} className="bg-black/50 backdrop-blur-sm border-cyan-500/20 card-3d glow-cyan">
                        <CardContent className="p-3">
                          <p className="text-xs text-cyan-300 truncate">{idx.name}</p>
                          <p className="font-bold font-mono mt-1 neon-cyan">{Number(idx.value).toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
                          <p className={`text-xs font-semibold mt-1 ${changePct >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
            </div>
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <Input
                placeholder="Search stocks by ticker or name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 bg-black/50 backdrop-blur-sm border-cyan-500/20 text-cyan-100 placeholder-cyan-300 glow-cyan"
              />
            </div>
          </div>

          {/* Stocks List */}
          <Card className="bg-black/50 backdrop-blur-sm border-magenta-500/20 card-3d glow-magenta">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold neon-magenta">
                {stocks?.length ?? 0} stocks found
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStocks ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : !stocks || stocks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No stocks found. Try a different search term.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-cyan-300 border-b border-cyan-500/20">
                        <th className="text-left pb-3 font-medium">Symbol</th>
                        <th className="text-left pb-3 font-medium">Company</th>
                        <th className="text-left pb-3 font-medium hidden md:table-cell">Exchange</th>
                        <th className="text-left pb-3 font-medium hidden lg:table-cell">Currency</th>
                        <th className="text-right pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stocks?.map((stock: any) => (
                        <StockRow key={`${stock.exchange}-${stock.ticker}`} stock={stock} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for stock row with its own data fetching
function StockRow({ stock }: { stock: { ticker: string; exchange: string; companyName: string; currency: string } }) {
  const { data: quote, isLoading } = useGetStockQuote({
    ticker: stock.ticker,
    exchange: stock.exchange
  });

  const changePct = quote ? Number(quote.changePct) : 0;

  return (
    <tr className="border-b border-magenta-500/20 hover:bg-magenta-500/10 transition-colors">
      <td className="py-3">
        <Link href={`/stock/${stock.exchange}/${stock.ticker}`} className="flex items-center gap-2">
          <span className="font-bold text-primary hover:underline">{stock.ticker}</span>
        </Link>
      </td>
      <td className="py-3 text-muted-foreground">{stock.companyName}</td>
      <td className="py-3 hidden md:table-cell">
        <Badge variant="outline" className="text-xs">{stock.exchange}</Badge>
      </td>
      <td className="py-3 hidden lg:table-cell text-muted-foreground">{stock.currency}</td>
      <td className="py-3 text-right">
        {isLoading ? (
          <Skeleton className="h-8 w-20 ml-auto" />
        ) : quote ? (
          <div className="flex items-center justify-end gap-2">
            <span className="font-mono font-semibold">
              {stock.currency === "USD" ? "$" : ""}{Number(quote.price).toFixed(2)}
            </span>
            <span className={`text-xs font-mono ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
              {changePct >= 0 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">No data</span>
        )}
      </td>
    </tr>
  );
}