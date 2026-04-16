/**
 * GlobalMarketView Component
 * Main component for displaying global markets with Neon 3D UI
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Globe, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Clock,
  Zap,
  BarChart3,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import NeonMarketCard from "./NeonMarketCard";
import MarketRegionSelector from "./MarketRegionSelector";
import { getGlobalMarketOverview, getMarketByRegion } from "@/services/marketDataAggregator";
import { getAfricanMarketsOverview } from "@/services/africaMarketService";
import type { MarketRegion, GlobalMarketOverview, MarketIndex } from "@/types/market";

interface GlobalMarketViewProps {
  onAssetSelect?: (asset: MarketIndex) => void;
  showAfricanMarkets?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function GlobalMarketView({
  onAssetSelect,
  showAfricanMarkets = true,
  autoRefresh = true,
  refreshInterval = 30000,
}: GlobalMarketViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<MarketRegion | "ALL">("ALL");
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fetch global market overview
  const { 
    data: globalOverview, 
    isLoading: isLoadingGlobal, 
    refetch: refetchGlobal,
    isFetching 
  } = useQuery({
    queryKey: ["globalMarketOverview", selectedRegion],
    queryFn: async () => {
      if (selectedRegion === "ALL") {
        return getGlobalMarketOverview();
      }
      const indices = await getMarketByRegion(selectedRegion);
      // Transform to GlobalMarketOverview format
      return {
        timestamp: new Date().toISOString(),
        regions: [{
          region: selectedRegion,
          performance: indices.reduce((sum, i) => sum + i.changePercent, 0) / indices.length,
          activeMarkets: indices.length,
          totalMarkets: indices.length,
        }],
        topGainers: [...indices].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5),
        topLosers: [...indices].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5),
        mostActive: [...indices].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5),
        indices,
      } as GlobalMarketOverview;
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Fetch African markets separately
  const { 
    data: africanMarkets, 
    isLoading: isLoadingAfrican,
    refetch: refetchAfrican 
  } = useQuery({
    queryKey: ["africanMarkets"],
    queryFn: getAfricanMarketsOverview,
    enabled: showAfricanMarkets,
    refetchInterval: autoRefresh ? refreshInterval * 2 : false, // Less frequent for African markets
  });

  // Filter indices by region
  const filteredIndices = globalOverview?.indices || [];

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    refetchGlobal();
    if (showAfricanMarkets) refetchAfrican();
    setLastUpdate(new Date());
  }, [refetchGlobal, refetchAfrican, showAfricanMarkets]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-primary" />
            Global Markets
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time market data from exchanges worldwide
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Last update indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Updated {lastUpdate.toLocaleTimeString()}</span>
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isFetching}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Region Selector */}
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4">
          <MarketRegionSelector
            selectedRegion={selectedRegion}
            onRegionChange={setSelectedRegion}
          />
        </CardContent>
      </Card>

      {/* Region Performance Overview */}
      {globalOverview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {globalOverview.regions.map((regionPerf) => (
            <Card 
              key={regionPerf.region}
              className={`
                bg-card/50 border-border/30 cursor-pointer transition-all duration-300
                ${selectedRegion === regionPerf.region ? "border-primary/50 shadow-lg shadow-primary/10" : ""}
              `}
              onClick={() => setSelectedRegion(regionPerf.region)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {regionPerf.region}
                  </span>
                  <Badge 
                    variant={regionPerf.performance >= 0 ? "default" : "destructive"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {regionPerf.performance >= 0 ? "+" : ""}{regionPerf.performance.toFixed(2)}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {regionPerf.activeMarkets}/{regionPerf.totalMarkets} active
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading State */}
      {(isLoadingGlobal || isLoadingAfrican) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50">
              <CardContent className="p-4">
                <Skeleton className="h-20 rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Market Cards Grid */}
      {!isLoadingGlobal && filteredIndices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Market Indices
            </h2>
            <Badge variant="outline" className="text-xs">
              {filteredIndices.length} markets
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredIndices.map((index) => (
              <NeonMarketCard
                key={`${index.exchange}-${index.symbol}`}
                asset={index}
                showDetails={true}
                onClick={() => onAssetSelect?.(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* African Markets Section */}
      {showAfricanMarkets && africanMarkets && (
        <div className="space-y-4 pt-6 border-t border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                African Markets
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {africanMarkets.summary.advancing} advancing, {africanMarkets.summary.declining} declining
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {africanMarkets.markets.length} exchanges
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {africanMarkets.markets.map((market) => (
              <NeonMarketCard
                key={`${market.exchange}-${market.symbol}`}
                asset={market}
                showDetails={true}
                onClick={() => onAssetSelect?.(market as MarketIndex)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Gainers & Losers */}
      {globalOverview && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-6 border-t border-border/30">
          {/* Top Gainers */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Top Gainers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalOverview.topGainers.slice(0, 5).map((gainer, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => onAssetSelect?.(gainer as MarketIndex)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{gainer.symbol}</span>
                      <span className="text-xs text-muted-foreground">{gainer.exchange}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{gainer.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-green-500 ml-2">
                        +{gainer.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Losers */}
          <Card className="bg-card/50 border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-red-500" />
                Top Losers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalOverview.topLosers.slice(0, 5).map((loser, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => onAssetSelect?.(loser as MarketIndex)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{loser.symbol}</span>
                      <span className="text-xs text-muted-foreground">{loser.exchange}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono">{loser.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-red-500 ml-2">
                        {loser.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most Active */}
      {globalOverview && globalOverview.mostActive.length > 0 && (
        <Card className="bg-card/50 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Most Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {globalOverview.mostActive.map((active, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onAssetSelect?.(active as MarketIndex)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold">{active.symbol}</span>
                    <span className={`text-xs ${active.changePercent >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {active.changePercent >= 0 ? "+" : ""}{active.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    Vol: {(active.volume || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}