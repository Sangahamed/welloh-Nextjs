/**
 * NeonMarketCard Component
 * 3D floating card with neon glow effects for market data display
 */

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Activity, Clock, Globe } from "lucide-react";
import type { MarketAsset, MarketIndex } from "@/types/market";

interface NeonMarketCardProps {
  asset: MarketAsset | MarketIndex;
  onClick?: () => void;
  showDetails?: boolean;
  compact?: boolean;
  animateOnHover?: boolean;
}

export default function NeonMarketCard({
  asset,
  onClick,
  showDetails = false,
  compact = false,
  animateOnHover = true,
}: NeonMarketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [flashClass, setFlashClass] = useState("");
  const [prevChangePercent, setPrevChangePercent] = useState(asset.changePercent);

  // Detect price changes for flash animation
  useEffect(() => {
    if (asset.changePercent > prevChangePercent) {
      setFlashClass("flash-up");
    } else if (asset.changePercent < prevChangePercent) {
      setFlashClass("flash-down");
    }
    setPrevChangePercent(asset.changePercent);

    const timer = setTimeout(() => setFlashClass(""), 1000);
    return () => clearTimeout(timer);
  }, [asset.changePercent, prevChangePercent]);

  const isPositive = asset.changePercent >= 0;
  const changeColor = isPositive ? "text-green-400" : "text-red-400";
  const glowColor = isPositive ? "shadow-green-500/20" : "shadow-red-500/20";
  const borderColor = isPositive ? "border-green-500/30" : "border-red-500/30";

  // Format currency based on region
  const formatPrice = useCallback((price: number, currency: string) => {
    const symbols: Record<string, string> = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      ZAR: "R",
      NGN: "₦",
      EGP: "E£",
      XOF: "CFA",
      UGX: "USh",
      AUD: "A$",
      JPY: "¥",
      HKD: "HK$",
      CNY: "¥",
      INR: "₹",
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  // Format large numbers
  const formatVolume = (volume?: number) => {
    if (!volume) return "—";
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
    return volume.toString();
  };

  // Get region flag emoji
  const getRegionEmoji = (region: string) => {
    const emojis: Record<string, string> = {
      AFRICA: "🌍",
      EUROPE: "🇪🇺",
      ASIA: "🌏",
      AMERICA: "🌎",
      OCEANIA: "🌏",
    };
    return emojis[region] || "🌐";
  };

  if (compact) {
    return (
      <div
        className={`
          relative p-3 rounded-lg cursor-pointer transition-all duration-300
          bg-gradient-to-br from-card/80 to-card/40
          border ${borderColor} 
          hover:border-opacity-60
          ${isHovered && animateOnHover ? `transform scale-105 -translate-y-1 shadow-lg ${glowColor}` : "shadow-md"}
          ${flashClass}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getRegionEmoji(asset.region)}</span>
            <div>
              <p className="font-bold text-sm truncate max-w-[120px]">{asset.symbol}</p>
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{asset.name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono font-semibold text-sm">{formatPrice(asset.price, asset.currency)}</p>
            <p className={`text-xs font-mono font-semibold ${changeColor}`}>
              {isPositive ? "+" : ""}{asset.changePercent.toFixed(2)}%
            </p>
          </div>
        </div>
        
        {asset.isDelayed && (
          <div className="absolute top-1 right-1">
            <Clock className="w-3 h-3 text-yellow-500/70" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        relative p-5 rounded-xl cursor-pointer transition-all duration-500
        bg-gradient-to-br from-card/90 to-card/60
        border ${borderColor}
        backdrop-blur-sm
        ${isHovered && animateOnHover 
          ? "transform scale-[1.02] -translate-y-2 shadow-2xl " + glowColor 
          : "shadow-lg hover:shadow-xl"}
        ${flashClass}
        overflow-hidden
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Animated background gradient */}
      <div 
        className={`
          absolute inset-0 opacity-0 transition-opacity duration-500
          bg-gradient-to-br ${isPositive ? "from-green-500/5" : "from-red-500/5"} to-transparent
        `}
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Header with region and symbol */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getRegionEmoji(asset.region)}</span>
            <div>
              <p className="font-bold text-lg leading-tight">{asset.symbol}</p>
              <p className="text-xs text-muted-foreground">{asset.exchange}</p>
            </div>
          </div>
          {asset.isDelayed && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20">
              <Clock className="w-3 h-3 text-yellow-500" />
              <span className="text-[10px] text-yellow-500">
                +{asset.delayMinutes}min
              </span>
            </div>
          )}
        </div>

        {/* Price display */}
        <div className="mb-4">
          <p className="text-3xl font-bold font-mono tracking-tight">
            {formatPrice(asset.price, asset.currency)}
          </p>
          <div className={`flex items-center gap-2 mt-1 ${changeColor}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-mono font-semibold text-lg">
              {isPositive ? "+" : ""}{asset.change.toFixed(2)} ({isPositive ? "+" : ""}{asset.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Details section */}
        {showDetails && (
          <div className="space-y-2 pt-3 border-t border-border/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Activity className="w-3 h-3" /> Volume
              </span>
              <span className="font-mono font-semibold">
                {formatVolume(asset.volume)}
              </span>
            </div>
            
            {(asset as MarketIndex).marketCap !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Market Cap
                </span>
                <span className="font-mono font-semibold">
                  ${(Number((asset as MarketIndex).marketCap) / 1e9).toFixed(1)}B
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated: {new Date(asset.lastUpdated).toLocaleTimeString()}</span>
              <span className="uppercase">{asset.dataSource}</span>
            </div>
          </div>
        )}

        {/* Hover glow effect */}
        <div 
          className={`
            absolute -inset-1 rounded-xl opacity-0 transition-opacity duration-500 pointer-events-none
            bg-gradient-to-r ${isPositive ? "from-green-500/10 via-transparent to-green-500/10" : "from-red-500/10 via-transparent to-red-500/10"}
            blur-xl
          `}
          style={{ opacity: isHovered ? 0.5 : 0 }}
        />
      </div>
    </div>
  );
}