import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, TrendingUp, Globe, DollarSign, BarChart2, Shield, ChevronRight } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  category: string;
  readTime: string;
  content: string;
}

const LESSONS: Lesson[] = [
  {
    id: "intro-trading",
    title: "Introduction to Stock Trading",
    description: "Learn the fundamentals of how stock markets work.",
    level: "Beginner",
    category: "Fundamentals",
    readTime: "5 min",
    content: `## What is Stock Trading?

Stock trading is the buying and selling of shares in publicly listed companies. When you buy a stock, you become a part-owner of that company and can benefit from its growth.

## How Stock Prices Work

Stock prices are determined by supply and demand:
- **High demand** → price rises
- **High supply** → price falls

## Key Terms
- **Bull Market**: Extended period of rising prices
- **Bear Market**: Extended period of falling prices
- **Liquidity**: How easily you can buy/sell without affecting the price
- **Volatility**: How much a stock's price fluctuates

## Order Types
1. **Market Order**: Buy/sell immediately at current price
2. **Limit Order**: Buy/sell only at a specific price or better
3. **Stop-Loss**: Automatically sell when price falls to a threshold

## Your First Trade on Welloh
1. Go to **Markets** and find a stock you're interested in
2. Click on it to see details
3. Set your quantity and click **Buy**
4. Monitor your position in **Dashboard**

Remember: Welloh uses virtual money, so practice freely!`
  },
  {
    id: "african-markets",
    title: "African Stock Markets Deep Dive",
    description: "Explore the BRVM, JSE, NSE, and EGX exchanges.",
    level: "Intermediate",
    category: "African Markets",
    readTime: "8 min",
    content: `## Overview of African Markets

Africa hosts several significant stock exchanges that represent the continent's growing economic power.

## BRVM — Bourse Régionale des Valeurs Mobilières
- **Location**: Abidjan, Côte d'Ivoire
- **Coverage**: 8 West African countries (WAEMU zone)
- **Currency**: West African CFA Franc (XOF)
- **Key Sectors**: Banking (SGBC, ETIT), Telecom (ONTBV), Industry
- **Characteristics**: Lower liquidity, long-term growth potential, regional integration

## JSE — Johannesburg Stock Exchange
- **Location**: South Africa
- **Oldest exchange in Africa** (established 1887)
- **Currency**: South African Rand (ZAR)
- **Key Sectors**: Mining, Banking, Retail
- **Notable stocks**: MTN, Naspers, Anglo American

## NSE — Nigerian Stock Exchange
- **Location**: Lagos, Nigeria
- **Largest economy in Africa**
- **Currency**: Nigerian Naira (NGN)
- **Key Sectors**: Banking, Oil & Gas, Consumer Goods
- **Notable stocks**: Dangote Cement, GTBank, Zenith Bank

## EGX — Egyptian Exchange
- **Location**: Cairo, Egypt
- **One of the oldest exchanges in Africa** (1903)
- **Currency**: Egyptian Pound (EGP)
- **Key Sectors**: Real estate, Banking, Telecom, Industry

## Investment Considerations for African Markets
1. **Currency risk**: Local currencies can fluctuate significantly vs USD
2. **Liquidity**: Some markets have lower trading volumes
3. **Political risk**: Stability varies by country
4. **Growth potential**: Rapidly expanding middle class
5. **Commodity exposure**: Many companies tied to natural resources`
  },
  {
    id: "fundamental-analysis",
    title: "Fundamental Analysis",
    description: "How to evaluate a company's intrinsic value.",
    level: "Intermediate",
    category: "Analysis",
    readTime: "10 min",
    content: `## What is Fundamental Analysis?

Fundamental analysis involves evaluating a company's financial health to determine if its stock is fairly priced.

## Key Financial Ratios

### Valuation Ratios
- **P/E (Price-to-Earnings)**: Stock price / Earnings per share
  - Lower = potentially undervalued
  - Compare within same industry
- **P/B (Price-to-Book)**: Market cap / Book value
  - Banks often trade near 1x book value
- **EV/EBITDA**: Enterprise value / EBITDA
  - Better for comparing companies with different debt levels

### Profitability Ratios
- **Return on Equity (ROE)**: Net income / Shareholders equity
- **Net Profit Margin**: Net income / Revenue
- **Operating Margin**: Operating income / Revenue

### Financial Health
- **Debt-to-Equity**: Total debt / Total equity (lower is safer)
- **Current Ratio**: Current assets / Current liabilities (>1 is good)
- **Free Cash Flow**: Cash from operations - Capital expenditures

## How to Use Welloh's AI Analysis
1. Go to the **Analysis** page
2. Search for any stock
3. Click **Run AI Analysis** for a comprehensive Gemini-powered report
4. Use "Comparison" mode to compare two companies head-to-head`
  },
  {
    id: "risk-management",
    title: "Risk Management & Portfolio Theory",
    description: "Protect your capital and maximize risk-adjusted returns.",
    level: "Advanced",
    category: "Strategy",
    readTime: "12 min",
    content: `## The Foundation of Investing: Managing Risk

Successful traders aren't those who make the most — they're those who lose the least when wrong.

## Key Concepts

### Diversification
- Spread investments across different:
  - Asset classes (stocks, bonds, commodities)
  - Geographies (US, Africa, Asia)
  - Sectors (tech, banking, consumer goods)
- **Modern Portfolio Theory**: Combining uncorrelated assets reduces portfolio volatility

### Position Sizing
- Never risk more than **1-2%** of your portfolio on a single trade
- Formula: Position Size = (Portfolio Value × Risk %) / (Entry - Stop Loss)

### The Sharpe Ratio
**Sharpe = (Portfolio Return - Risk-Free Rate) / Portfolio Standard Deviation**

- Measures return per unit of risk
- Higher is better (>1 is good, >2 is excellent)
- Welloh tracks your Sharpe ratio on the Leaderboard

### Stop Losses
- Set automatic exits to limit downside
- Common levels: -5%, -8%, -10% from entry
- Trail stops as the position moves in your favor

## Psychology of Trading
1. **Fear and Greed**: The two emotions that destroy accounts
2. **Loss Aversion**: We feel losses 2x more than gains — trade with a plan
3. **Confirmation Bias**: Seek evidence that contradicts your thesis
4. **FOMO**: Missing a trade is better than entering a bad one

## Portfolio Construction
1. **Core positions** (60-70%): High-conviction, diversified holdings
2. **Satellite positions** (20-30%): Higher-risk, higher-reward opportunities  
3. **Cash reserve** (10%): For opportunities and emergencies`
  },
  {
    id: "technical-analysis",
    title: "Technical Analysis Basics",
    description: "Read charts and identify trading opportunities.",
    level: "Intermediate",
    category: "Analysis",
    readTime: "7 min",
    content: `## What is Technical Analysis?

Technical analysis uses historical price and volume data to predict future price movements. Unlike fundamental analysis, it focuses on price patterns rather than company value.

## Key Concepts

### Support & Resistance
- **Support**: Price level where buying interest emerges (floor)
- **Resistance**: Price level where selling pressure emerges (ceiling)
- When price breaks through resistance, it often becomes new support

### Moving Averages
- **Simple Moving Average (SMA)**: Average price over N days
- **20-day SMA**: Short-term trend
- **50-day SMA**: Medium-term trend  
- **200-day SMA**: Long-term trend
- **Golden Cross**: 50-day crosses above 200-day → bullish signal
- **Death Cross**: 50-day crosses below 200-day → bearish signal

### Volume Analysis
- Price moves on high volume are more significant
- Volume declining during a rally = weakening trend
- Volume surging on a breakout = strong signal

### Common Patterns
1. **Head & Shoulders**: Reversal pattern (bearish)
2. **Double Bottom**: Reversal pattern (bullish)
3. **Bull Flag**: Continuation pattern (bullish)
4. **Triangle**: Consolidation before breakout

## Practical Application on Welloh
- Use the Markets page to scan for stocks making significant moves
- Check the 52-week high/low range on stock detail pages
- Combine with AI Analysis for a complete picture`
  },
  {
    id: "portfolio-optimization",
    title: "Portfolio Optimization Strategies",
    description: "Advanced techniques for maximizing risk-adjusted returns.",
    level: "Advanced",
    category: "Strategy",
    readTime: "15 min",
    content: `## Advanced Portfolio Management

Once you understand the basics, these techniques will help you build a more sophisticated portfolio.

## Factor Investing
Tilt your portfolio toward stocks with proven return drivers:

1. **Value Factor**: Cheap stocks (low P/E, P/B) outperform long-term
2. **Momentum Factor**: Stocks rising tend to keep rising (12-1 month momentum)
3. **Quality Factor**: High ROE, low debt, stable earnings
4. **Size Factor**: Small-caps historically outperform large-caps
5. **Low Volatility Factor**: Less volatile stocks often deliver better risk-adjusted returns

## African Market Alpha Sources
- **Frontier Market Premium**: Higher returns for taking on emerging market risk
- **Dividend Plays**: BRVM stocks often have high dividend yields
- **Currency Plays**: Benefit from ZAR, NGN, EGP fluctuations
- **Sector Rotation**: Different sectors lead at different economic cycle stages

## The Leaderboard Strategy
To climb Welloh's leaderboard, focus on:
1. **Maximize Sharpe Ratio** (not just returns)
2. **Trade with discipline**: Use stop losses
3. **Diversify across exchanges**: Include African stocks for uncorrelated returns
4. **Let winners run**: Cut losses early, hold winning positions longer
5. **Use AI Analysis**: Let Gemini identify catalysts and risks

## Rebalancing
- **Time-based**: Rebalance every quarter
- **Threshold-based**: Rebalance when any position exceeds target weight by >5%
- **Tax-efficient**: In simulators, rebalance freely — learn without tax constraints`
  }
];

const CATEGORIES = ["All", ...Array.from(new Set(LESSONS.map(l => l.category)))];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: "bg-green-500/10 text-green-400 border-green-500/30",
  Intermediate: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  Advanced: "bg-purple-500/10 text-purple-400 border-purple-500/30",
};

const CATEGORY_ICONS: Record<string, any> = {
  Fundamentals: BookOpen,
  "African Markets": Globe,
  Analysis: BarChart2,
  Strategy: Shield,
};

export default function Learn() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const filtered = LESSONS.filter(l => selectedCategory === "All" || l.category === selectedCategory);

  if (selectedLesson) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setSelectedLesson(null)}>
          ← Back to Lessons
        </Button>
        <div>
          <Badge className={`mb-4 border ${LEVEL_COLORS[selectedLesson.level]}`}>{selectedLesson.level}</Badge>
          <h1 className="text-3xl font-bold">{selectedLesson.title}</h1>
          <p className="text-muted-foreground mt-2">{selectedLesson.readTime} read · {selectedLesson.category}</p>
        </div>
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              {selectedLesson.content.split('\n').map((line, i) => {
                if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-base font-semibold mt-4 mb-2 text-primary">{line.slice(4)}</h3>;
                if (line.startsWith('- ')) return <li key={i} className="ml-4 text-muted-foreground">{line.slice(2)}</li>;
                if (/^\d+\./.test(line)) return <li key={i} className="ml-4 text-muted-foreground">{line.replace(/^\d+\.\s/, '')}</li>;
                if (line === '') return <br key={i} />;
                return <p key={i} className="text-foreground/90">{line}</p>;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Education Hub</h1>
        <p className="text-muted-foreground mt-1">Master trading from fundamentals to advanced strategies.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((lesson) => {
          const Icon = CATEGORY_ICONS[lesson.category] ?? GraduationCap;
          return (
            <Card
              key={lesson.id}
              className="bg-card border-border hover:bg-accent/20 transition-colors cursor-pointer group"
              onClick={() => setSelectedLesson(lesson)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge className={`border text-xs ${LEVEL_COLORS[lesson.level]}`}>{lesson.level}</Badge>
                </div>
                <h3 className="font-bold mb-2 group-hover:text-primary transition-colors">{lesson.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{lesson.description}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{lesson.readTime}</span>
                  <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    Read <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
