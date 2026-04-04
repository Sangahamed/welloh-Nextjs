import { useState, useRef, useEffect } from "react";
import { useSearchStocks } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, Search, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLocation } from "wouter";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function useAnalysisFromParams() {
  const [location] = useLocation();
  const params = new URLSearchParams(location.includes("?") ? location.split("?")[1] : "");
  return {
    ticker: params.get("ticker") ?? "",
    exchange: params.get("exchange") ?? "",
    name: params.get("name") ?? "",
  };
}

export default function Analysis() {
  const fromParams = useAnalysisFromParams();
  const [query, setQuery] = useState(fromParams.ticker);
  const [exchange, setExchange] = useState(fromParams.exchange || "All");
  const [selectedStock, setSelectedStock] = useState<{ ticker: string; exchange: string; name: string } | null>(
    fromParams.ticker ? { ticker: fromParams.ticker, exchange: fromParams.exchange, name: fromParams.name } : null
  );
  const [analysisType, setAnalysisType] = useState("full");
  const [compareWith, setCompareWith] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const { data: results } = useSearchStocks({ q: query || undefined, exchange: exchange === "All" ? undefined : exchange, limit: 10 });

  async function runAnalysis() {
    if (!selectedStock) return;
    setAnalysisText("");
    setIsAnalyzing(true);
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`${BASE_URL}/api/gemini/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: selectedStock.ticker,
          exchange: selectedStock.exchange,
          companyName: selectedStock.name,
          analysisType,
          compareTo: analysisType === "comparison" ? compareWith : undefined,
        }),
        signal: abortRef.current.signal,
        credentials: "include",
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          if (part.startsWith("data: ")) {
            try {
              const data = JSON.parse(part.slice(6));
              if (data.content) setAnalysisText((prev) => prev + data.content);
            } catch {}
          }
        }
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") setAnalysisText("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Stock Analysis</h1>
        <p className="text-muted-foreground mt-1">Powered by Gemini — get deep research on any stock in seconds.</p>
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-4">
          {/* Stock Search */}
          <div className="relative">
            <label className="text-sm font-medium text-muted-foreground">Search Stock</label>
            <div className="flex gap-2 mt-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="AAPL, SGBC, DANGCEM..."
                  className="pl-9 bg-background border-border"
                />
              </div>
              <Select value={exchange} onValueChange={setExchange}>
                <SelectTrigger className="w-36 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["All", "NYSE", "NASDAQ", "BRVM", "JSE", "NSE", "EGX"].map((ex) => (
                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {searchOpen && results && results.length > 0 && (
              <div className="absolute z-50 w-full bg-popover border border-border rounded-lg shadow-xl mt-1 overflow-hidden">
                {results.map((s) => (
                  <button
                    key={`${s.exchange}-${s.ticker}`}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent text-left transition-colors"
                    onClick={() => {
                      setSelectedStock({ ticker: s.ticker, exchange: s.exchange, name: s.name });
                      setQuery(s.ticker);
                      setSearchOpen(false);
                    }}
                  >
                    <span>
                      <span className="font-bold text-primary">{s.ticker}</span>
                      <span className="ml-2 text-muted-foreground text-sm">{s.name}</span>
                    </span>
                    <Badge variant="outline" className="text-xs">{s.exchange}</Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStock && (
            <div className="flex items-center gap-2 p-3 bg-accent/30 rounded-lg border border-border">
              <BrainCircuit className="w-4 h-4 text-primary" />
              <span className="font-semibold">{selectedStock.ticker}</span>
              <Badge variant="outline" className="text-xs">{selectedStock.exchange}</Badge>
              <span className="text-muted-foreground text-sm">{selectedStock.name}</span>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground">Analysis Type</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger className="mt-1 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Equity Research Report</SelectItem>
                  <SelectItem value="comparison">Comparative Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {analysisType === "comparison" && (
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground">Compare With</label>
                <Input
                  value={compareWith}
                  onChange={(e) => setCompareWith(e.target.value)}
                  placeholder="e.g. MSFT, SAFCOM"
                  className="mt-1 bg-background border-border"
                />
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={runAnalysis}
            disabled={!selectedStock || isAnalyzing}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
            ) : (
              <><BrainCircuit className="w-4 h-4 mr-2" /> Run AI Analysis</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Output */}
      {(analysisText || isAnalyzing) && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-primary" />
              Analysis: {selectedStock?.ticker}
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground ml-2" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-invert prose-sm max-w-none text-foreground">
              <ReactMarkdown>{analysisText}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
