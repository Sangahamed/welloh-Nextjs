"use client";

import { useState } from "react";
import Link from "next/link";
import { useGetStockQuote, useExecuteTrade, useAddToWatchlist, useGetWatchlist } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, Star, BrainCircuit, ArrowLeft } from "lucide-react";

export default function Page({ params }: { params: { exchange: string; ticker: string } }) {
  const { exchange, ticker } = params;
  const [quantity, setQuantity] = useState("");
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const { toast } = useToast();

  const { data: quoteData, isLoading } = useGetStockQuote({ ticker, exchange });
  const quote = quoteData as any;
  const { data: watchlist } = useGetWatchlist();
  const { mutate: trade, isPending: tradePending } = useExecuteTrade();
  const { mutate: addWatch } = useAddToWatchlist();

  const isWatched = watchlist?.some((w: any) => w.ticker === ticker && w.exchange === exchange);
  const changePct = Number(quote?.changePct ?? 0);
  const price = Number(quote?.price ?? 0);
  const qty = parseFloat(quantity) || 0;
  const estimatedCost = qty * price;

  function handleTrade() {
    if (!qty || qty <= 0) {
      toast({ title: "Enter a valid quantity", variant: "destructive" });
      return;
    }
    trade(
      { data: { ticker, exchange, quantity: qty, action: tradeType } as any },
      {
        onSuccess: (result: any) => {
          toast({
            title: `${tradeType === "buy" ? "Bought" : "Sold"} ${result.quantity} ${ticker}`,
            description: `Filled at $${Number(result.price).toFixed(2)} · Fee: $${Number(result.fee).toFixed(2)}`,
          });
          setQuantity("");
        },
        onError: (err: any) => {
          toast({ title: "Trade failed", description: err?.message ?? "Unknown error", variant: "destructive" });
        },
      }
    );
  }

  function handleWatch() {
    addWatch(
      { data: { ticker, exchange } },
      {
        onSuccess: () => toast({ title: `${ticker} added to watchlist` }),
        onError: () => toast({ title: "Already in watchlist" }),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/markets">
          <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Markets</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : quote ? (
        <>
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-bold">{ticker}</h1>
                <Badge variant="outline">{exchange}</Badge>
              </div>
              <p className="text-muted-foreground mt-1">{quote.name}</p>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-4xl font-bold font-mono">{quote.currency !== "USD" ? "" : "$"}{price.toFixed(2)} {quote.currency !== "USD" ? quote.currency : ""}</span>
                <span className={`flex items-center gap-1 text-lg font-semibold ${changePct >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {changePct >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {!isWatched && (
                <Button variant="outline" onClick={handleWatch}>
                  <Star className="w-4 h-4 mr-2" /> Watch
                </Button>
              )}
              <Link href={`/analysis?ticker=${ticker}&exchange=${exchange}&name=${encodeURIComponent(quote.name)}`}>
                <Button variant="outline">
                  <BrainCircuit className="w-4 h-4 mr-2" /> AI Analysis
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Stats */}
            <div className="xl:col-span-2 space-y-4">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {[
                      { label: "Open", value: `$${Number(quote.open).toFixed(2)}` },
                      { label: "Previous Close", value: `$${Number(quote.previousClose).toFixed(2)}` },
                      { label: "Day's Range", value: `$${Number(quote.low).toFixed(2)} – $${Number(quote.high).toFixed(2)}` },
                      { label: "52-Wk Range", value: `$${Number(quote.yearLow).toFixed(2)} – $${Number(quote.yearHigh).toFixed(2)}` },
                      { label: "Volume", value: Number(quote.volume).toLocaleString() },
                      { label: "Market Cap", value: quote.marketCap ? `$${(Number(quote.marketCap) / 1e9).toFixed(2)}B` : "—" },
                      { label: "P/E Ratio", value: quote.pe ? Number(quote.pe).toFixed(2) : "—" },
                      { label: "EPS", value: quote.eps ? `$${Number(quote.eps).toFixed(2)}` : "—" },
                      { label: "Div Yield", value: quote.dividendYield ? `${(Number(quote.dividendYield) * 100).toFixed(2)}%` : "—" },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="font-semibold font-mono mt-1">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trade Panel */}
            <Card className="bg-card border-border self-start">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Place Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={tradeType} onValueChange={(v) => setTradeType(v as "buy" | "sell")}>
                  <TabsList className="w-full">
                    <TabsTrigger value="buy" className="flex-1">Buy</TabsTrigger>
                    <TabsTrigger value="sell" className="flex-1">Sell</TabsTrigger>
                  </TabsList>
                </Tabs>

                <div>
                  <label className="text-sm text-muted-foreground">Quantity (shares)</label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="mt-1 bg-background border-border font-mono"
                  />
                </div>

                <div className="text-sm space-y-1 border-t border-border pt-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Price per share</span>
                    <span className="font-mono">${price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Est. fee (~0.1%)</span>
                    <span className="font-mono">${(estimatedCost * 0.001).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t border-border">
                    <span>Total</span>
                    <span className="font-mono">${(estimatedCost * 1.001).toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className={`w-full font-semibold ${tradeType === "sell" ? "bg-red-600 hover:bg-red-700" : ""}`}
                  onClick={handleTrade}
                  disabled={tradePending || !qty}
                >
                  {tradePending ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${ticker}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <div className="text-center text-muted-foreground py-20">Stock not found.</div>
      )}
    </div>
  );
}