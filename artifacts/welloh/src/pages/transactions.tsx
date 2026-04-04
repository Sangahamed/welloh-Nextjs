import { useState } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { Link } from "wouter";

export default function Transactions() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useListTransactions({
    limit,
    offset: (page - 1) * limit,
  });

  const transactions = data ?? [];
  const hasMore = transactions.length === limit;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction History</h1>
        <p className="text-muted-foreground mt-1">All your trades and portfolio activity.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4" />
            Trade History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16">
              <ArrowUpDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet.</p>
              <Link href="/markets">
                <Button className="mt-4" variant="outline">Browse Markets</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left pb-3 font-medium">Date</th>
                      <th className="text-left pb-3 font-medium">Action</th>
                      <th className="text-left pb-3 font-medium">Symbol</th>
                      <th className="text-right pb-3 font-medium">Qty</th>
                      <th className="text-right pb-3 font-medium">Price</th>
                      <th className="text-right pb-3 font-medium">Fee</th>
                      <th className="text-right pb-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => {
                      const isBuy = tx.action === "buy";
                      return (
                        <tr key={tx.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                          <td className="py-3 text-muted-foreground text-xs">
                            {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3">
                            <Badge className={isBuy ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-red-500/10 text-red-400 border border-red-500/30"}>
                              {isBuy ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                              {isBuy ? "BUY" : "SELL"}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Link href={`/stock/${tx.exchange}/${tx.ticker}`} className="font-bold text-primary hover:underline">{tx.ticker}</Link>
                            <span className="ml-1 text-xs text-muted-foreground">{tx.exchange}</span>
                          </td>
                          <td className="py-3 text-right font-mono">{Number(tx.quantity).toFixed(4)}</td>
                          <td className="py-3 text-right font-mono">${Number(tx.price).toFixed(2)}</td>
                          <td className="py-3 text-right font-mono text-muted-foreground">${Number(tx.fee).toFixed(2)}</td>
                          <td className="py-3 text-right font-mono font-semibold">
                            ${(Number(tx.price) * Number(tx.quantity) + Number(tx.fee)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
