/**
 * MarketRegionSelector Component
 * Animated region selector with neon glow effects
 */

import { useState } from "react";
import { Globe, Activity, TrendingUp } from "lucide-react";
import type { MarketRegion } from "@/types/market";

interface RegionData {
  id: MarketRegion;
  name: string;
  emoji: string;
  description: string;
  marketCount: number;
}

const REGIONS: RegionData[] = [
  {
    id: "AFRICA",
    name: "Africa",
    emoji: "🌍",
    description: "BRVM, JSE, NSE, EGX",
    marketCount: 6,
  },
  {
    id: "EUROPE",
    name: "Europe",
    emoji: "🇪🇺",
    description: "LSE, Euronext, DAX",
    marketCount: 4,
  },
  {
    id: "ASIA",
    name: "Asia",
    emoji: "🌏",
    description: "Nikkei, Hang Seng, SSE",
    marketCount: 4,
  },
  {
    id: "AMERICA",
    name: "Americas",
    emoji: "🌎",
    description: "NYSE, NASDAQ",
    marketCount: 4,
  },
  {
    id: "OCEANIA",
    name: "Oceania",
    emoji: "🌏",
    description: "ASX, NZX",
    marketCount: 2,
  },
];

interface MarketRegionSelectorProps {
  selectedRegion: MarketRegion | "ALL";
  onRegionChange: (region: MarketRegion | "ALL") => void;
  showAllOption?: boolean;
  compact?: boolean;
}

export default function MarketRegionSelector({
  selectedRegion,
  onRegionChange,
  showAllOption = true,
  compact = false,
}: MarketRegionSelectorProps) {
  const [hoveredRegion, setHoveredRegion] = useState<MarketRegion | "ALL" | null>(null);

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {showAllOption && (
          <button
            onClick={() => onRegionChange("ALL")}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
              ${selectedRegion === "ALL"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
              }
            `}
          >
            <Globe className="w-3 h-3 inline mr-1" />
            All
          </button>
        )}
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => onRegionChange(region.id)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
              ${selectedRegion === region.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-border/50"
              }
            `}
          >
            {region.emoji} {region.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 flex-wrap justify-center">
      {showAllOption && (
        <RegionButton
          region={{ id: "ALL", name: "All Markets", emoji: "🌐", description: "Global overview", marketCount: 20 }}
          isSelected={selectedRegion === "ALL"}
          isHovered={hoveredRegion === "ALL"}
          onHover={() => setHoveredRegion("ALL")}
          onUnhover={() => setHoveredRegion(null)}
          onClick={() => onRegionChange("ALL")}
        />
      )}
      {REGIONS.map((region) => (
        <RegionButton
          key={region.id}
          region={region}
          isSelected={selectedRegion === region.id}
          isHovered={hoveredRegion === region.id}
          onHover={() => setHoveredRegion(region.id)}
          onUnhover={() => setHoveredRegion(null)}
          onClick={() => onRegionChange(region.id)}
        />
      ))}
    </div>
  );
}

interface RegionButtonProps {
  region: { id: MarketRegion | "ALL"; name: string; emoji: string; description: string; marketCount: number };
  isSelected: boolean;
  isHovered: boolean;
  onHover: () => void;
  onUnhover: () => void;
  onClick: () => void;
}

function RegionButton({ region, isSelected, isHovered, onHover, onUnhover, onClick }: RegionButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onUnhover}
      className={`
        relative group flex items-center gap-3 p-3 rounded-xl transition-all duration-500
        ${isSelected 
          ? "bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/50 shadow-lg shadow-primary/20" 
          : "bg-card/50 border border-border/30 hover:border-primary/30"
        }
        ${isHovered && !isSelected ? "transform -translate-y-1 shadow-xl" : ""}
        min-w-[140px]
      `}
    >
      {/* Animated glow effect on hover */}
      <div 
        className={`
          absolute inset-0 rounded-xl transition-opacity duration-500 pointer-events-none
          bg-gradient-to-r from-primary/10 via-transparent to-primary/10
          ${isHovered || isSelected ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Region emoji with pulse animation when selected */}
      <div className={`
        relative z-10 text-2xl
        ${isSelected ? "animate-pulse" : ""}
      `}>
        {region.emoji}
      </div>

      {/* Region info */}
      <div className="relative z-10 text-left">
        <p className={`font-bold text-sm ${isSelected ? "text-primary" : "text-foreground"}`}>
          {region.name}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {region.description}
        </p>
      </div>

      {/* Market count badge */}
      <div className={`
        relative z-10 ml-auto px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold
        ${isSelected 
          ? "bg-primary/20 text-primary" 
          : "bg-muted text-muted-foreground"
        }
      `}>
        {region.marketCount}
      </div>

      {/* Bottom border accent when selected */}
      {isSelected && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-primary rounded-full" />
      )}
    </button>
  );
}

// Performance indicator component
export function RegionPerformanceIndicator({ 
  performance 
}: { 
  performance: number 
}) {
  const isPositive = performance >= 0;
  const absPerformance = Math.abs(performance);
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <TrendingUp 
          className={`w-4 h-4 ${isPositive ? "text-green-500" : "text-red-500 rotate-180"}`} 
        />
        <span className={`font-mono font-semibold ${isPositive ? "text-green-500" : "text-red-500"}`}>
          {isPositive ? "+" : ""}{performance.toFixed(2)}%
        </span>
      </div>
      
      {/* Mini performance bar */}
      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${isPositive ? "bg-green-500" : "bg-red-500"}`}
          style={{ width: `${Math.min(absPerformance * 10, 100)}%` }}
        />
      </div>
    </div>
  );
}