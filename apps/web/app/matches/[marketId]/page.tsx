"use client";
import { use, useEffect, useState, useCallback, useMemo, lazy, Suspense } from "react";
import type { MarketSnapshot } from "@exchange/shared";
import { BetPanel } from "@/components/BetPanel";
import OddsLadderOptimized from "@/components/OddsLadderOptimized";
import { getSocket } from "@/lib/socket";
import { useExchangeStore } from "@/store/exchangeStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Lazy load chart components for better performance
const ChartContainer = lazy(() => import("@/components/charts/ChartContainer"));

export default function MatchPage({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = use(params);
  const { setMarket } = useExchangeStore();
  const [market, setLocalMarket] = useState<MarketSnapshot | null>(null);
  const [ticket, setTicket] = useState<{ selectionId?: string; side: "BACK" | "LAY"; price?: number }>({ side: "BACK" });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized market update handler to prevent unnecessary re-renders
  const handleMarketUpdate = useCallback((newMarket: MarketSnapshot) => {
    setLocalMarket(newMarket);
    setMarket(newMarket); // Update global store
  }, [setMarket]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const socket = getSocket();
    
    // Request market snapshot
    socket.emit("market:subscribe", marketId);
    
    const handleSnapshot = (snapshot: MarketSnapshot) => {
      handleMarketUpdate(snapshot);
      setIsLoading(false);
    };
    
    const handleUpdate = (update: MarketSnapshot) => {
      handleMarketUpdate(update);
    };
    
    const handleError = (err: any) => {
      console.error("Socket error:", err);
      setError("Failed to connect to market data");
      setIsLoading(false);
    };

    socket.on("market:snapshot", handleSnapshot);
    socket.on("market:update", handleUpdate);
    socket.on("connect_error", handleError);
    socket.on("error", handleError);

    // Set a timeout for initial data
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setError("Market data loading timeout");
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      socket.emit("market:unsubscribe", marketId);
      socket.off("market:snapshot", handleSnapshot);
      socket.off("market:update", handleUpdate);
      socket.off("connect_error", handleError);
      socket.off("error", handleError);
    };
  }, [marketId, handleMarketUpdate, isLoading]);

  const handlePick = useCallback((selectionId: string, side: "BACK" | "LAY", price: number) => {
    setTicket({ selectionId, side, price });
  }, []);

  // Memoize the market display data
  const displayMarket = useMemo(() => {
    if (market) return market;
    
    // Fallback to mock data while loading (should be replaced with skeleton)
    return {
      marketId,
      eventId: "",
      eventName: "Loading Match...",
      marketName: "Match Odds",
      marketType: "MATCH_ODDS",
      status: "OPEN",
      startTime: new Date().toISOString(),
      runners: [],
      version: 1,
      updatedAt: new Date().toISOString(),
      totalMatched: 0,
      inPlay: false,
      metadata: {},
    } as MarketSnapshot;
  }, [market, marketId]);

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-line bg-panel">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <h3 className="mb-2 text-xl font-bold">Market Data Unavailable</h3>
          <p className="text-slate-400">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-back px-4 py-2 font-medium hover:bg-back/80"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !market) {
    return (
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <div className="h-4 w-32 skeleton rounded"></div>
              <div className="h-8 w-64 skeleton rounded"></div>
            </div>
            <div className="h-8 w-24 skeleton rounded-full"></div>
          </div>
          <div className="h-[400px] skeleton rounded-2xl"></div>
        </section>
        <aside className="space-y-4">
          <div className="h-[300px] skeleton rounded-2xl"></div>
          <div className="h-16 skeleton rounded-2xl"></div>
        </aside>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="space-y-6">
        {/* Market Header */}
        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                {displayMarket.marketName}
              </p>
              <h1 className="text-2xl font-black md:text-3xl">
                {displayMarket.eventName}
              </h1>
              <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-400">
                <span>Market ID: {displayMarket.marketId}</span>
                <span>•</span>
                <span>Start: {new Date(displayMarket.startTime).toLocaleString()}</span>
                <span>•</span>
                <span>Total Matched: ₹{(displayMarket.totalMatched || 0).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-sm font-semibold ${
                displayMarket.status === "OPEN" ? "bg-emerald-500/15 text-emerald-300" :
                displayMarket.status === "SUSPENDED" ? "bg-amber-500/15 text-amber-300" :
                displayMarket.status === "CLOSED" ? "bg-slate-500/15 text-slate-300" :
                "bg-blue-500/15 text-blue-300"
              }`}>
                {displayMarket.status}
              </span>
              {displayMarket.inPlay && (
                <span className="rounded-full bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-300">
                  IN-PLAY
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Odds Ladder */}
        <div className="rounded-2xl">
          <OddsLadderOptimized
            runners={displayMarket.runners}
            onPick={handlePick}
            maxPriceLevels={5}
          />
        </div>

        {/* Chart Section */}
        <div className="rounded-2xl border border-line bg-panel p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-xl font-bold">Market Analytics</h3>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400">Auto-refresh:</span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                ON
              </span>
            </div>
          </div>
          
          <Suspense fallback={
            <div className="flex h-[400px] items-center justify-center">
              <LoadingSpinner size="lg" />
              <span className="ml-3 text-slate-400">Loading charts...</span>
            </div>
          }>
            <ChartContainer
              type="combined"
              height={400}
              autoRefresh={true}
              refreshInterval={30000}
              onRefresh={() => {
                // Trigger market data refresh
                const socket = getSocket();
                socket.emit("market:refresh", marketId);
              }}
            />
          </Suspense>
        </div>
      </section>

      {/* Trading Panel */}
      <aside className="space-y-6">
        <div className="sticky top-6 space-y-6">
          <BetPanel marketId={marketId} {...ticket} />
          
          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="mb-4 text-lg font-bold">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="rounded-xl bg-back/20 p-4 text-center hover:bg-back/30">
                <div className="text-2xl">📊</div>
                <div className="mt-2 text-sm font-medium">Market Depth</div>
              </button>
              <button
                className="rounded-xl bg-lay/20 p-4 text-center hover:bg-lay/30"
                onClick={() => {
                  // Scroll to chart section
                  document.querySelector('.rounded-2xl.border-line.bg-panel')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="text-2xl">📈</div>
                <div className="mt-2 text-sm font-medium">View Charts</div>
              </button>
              <button className="rounded-xl bg-emerald-500/20 p-4 text-center hover:bg-emerald-500/30">
                <div className="text-2xl">💸</div>
                <div className="mt-2 text-sm font-medium">Cashout</div>
              </button>
              <button className="rounded-xl bg-amber-500/20 p-4 text-center hover:bg-amber-500/30">
                <div className="text-2xl">⚙️</div>
                <div className="mt-2 text-sm font-medium">Settings</div>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
            <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-emerald-200">
              <span>⚡</span> Real-time Cashout
            </h3>
            <p className="mb-4 text-sm text-emerald-300/80">
              Cash out your bet instantly at the current market price.
            </p>
            <button className="w-full rounded-xl bg-emerald-500 px-6 py-4 font-bold text-white hover:bg-emerald-600">
              Check Cashout Value
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
