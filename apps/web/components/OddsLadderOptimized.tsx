"use client";
import type { RunnerPrice } from "@exchange/shared";
import { memo, useCallback, useMemo, useState, useEffect } from "react";

interface OddsLadderProps {
  runners: RunnerPrice[];
  onPick: (selectionId: string, side: "BACK" | "LAY", price: number) => void;
  maxPriceLevels?: number;
}

interface PriceCellProps {
  price: number;
  size: number;
  tone: "back" | "lay";
  onClick: () => void;
  hidden?: boolean;
  flashDirection?: "up" | "down" | null;
}

// Memoized PriceCell component to prevent unnecessary re-renders
const PriceCell = memo(function PriceCell({
  price,
  size,
  tone,
  onClick,
  hidden = false,
  flashDirection = null,
}: PriceCellProps) {
  const toneClass = tone === "back" 
    ? "bg-back/20 hover:bg-back/40" 
    : "bg-lay/20 hover:bg-lay/40";
  
  const flashClass = flashDirection === "up" 
    ? "flash-up" 
    : flashDirection === "down" 
      ? "flash-down" 
      : "";

  return (
    <button
      onClick={onClick}
      className={`
        ${hidden ? "max-md:hidden" : ""}
        ${toneClass}
        ${flashClass}
        p-2 text-center transition-colors duration-150
        min-h-[60px] flex flex-col justify-center
      `}
      aria-label={`${tone} at ${price} with size ${size}`}
    >
      <b className="text-lg font-bold tracking-tight">{price.toFixed(2)}</b>
      <p className="text-xs text-slate-300 mt-1">{size.toLocaleString()}</p>
    </button>
  );
});

PriceCell.displayName = "PriceCell";

// Helper to compare price arrays and detect changes
function usePriceFlashTracker(runners: RunnerPrice[]) {
  const [previousPrices, setPreviousPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const newPreviousPrices: Record<string, number> = {};
    
    runners.forEach((runner) => {
      // Track back prices
      runner.back.forEach((level, index) => {
        const key = `${runner.selectionId}-b-${index}`;
        newPreviousPrices[key] = level.price;
      });
      
      // Track lay prices
      runner.lay.forEach((level, index) => {
        const key = `${runner.selectionId}-l-${index}`;
        newPreviousPrices[key] = level.price;
      });
    });
    
    setPreviousPrices(newPreviousPrices);
  }, [runners]);

  return { previousPrices };
}

export function OddsLadderOptimized({ 
  runners, 
  onPick, 
  maxPriceLevels = 3 
}: OddsLadderProps) {
  const { previousPrices } = usePriceFlashTracker(runners);
  
  const handlePick = useCallback((selectionId: string, side: "BACK" | "LAY", price: number) => {
    onPick(selectionId, side, price);
  }, [onPick]);

  // Memoize the header to prevent re-renders
  const header = useMemo(() => (
    <div className="grid grid-cols-[1fr_repeat(6,80px)] gap-px bg-line text-xs text-slate-400 max-md:grid-cols-[1fr_repeat(2,80px)]">
      <div className="bg-panel p-3 font-medium">Runner</div>
      <div className="bg-panel p-3 max-md:hidden font-medium">Back 3</div>
      <div className="bg-panel p-3 max-md:hidden font-medium">Back 2</div>
      <div className="bg-panel p-3 font-medium">Back</div>
      <div className="bg-panel p-3 font-medium">Lay</div>
      <div className="bg-panel p-3 max-md:hidden font-medium">Lay 2</div>
      <div className="bg-panel p-3 max-md:hidden font-medium">Lay 3</div>
    </div>
  ), []);

  // Memoize runner rows
  const runnerRows = useMemo(() => 
    runners.map((runner) => {
      // Get back prices (show highest first, limit to maxPriceLevels)
      const backPrices = [...runner.back]
        .sort((a, b) => b.price - a.price)
        .slice(0, maxPriceLevels);
      
      // Get lay prices (show lowest first, limit to maxPriceLevels)
      const layPrices = [...runner.lay]
        .sort((a, b) => a.price - b.price)
        .slice(0, maxPriceLevels);

      return (
        <div 
          key={runner.selectionId} 
          className="grid grid-cols-[1fr_repeat(6,80px)] gap-px border-t border-line bg-line max-md:grid-cols-[1fr_repeat(2,80px)]"
        >
          {/* Runner info */}
          <div className="bg-panel p-3">
            <div className="flex flex-col">
              <b className="text-base font-semibold">
                {runner.selectionName || `Selection ${runner.selectionId}`}
              </b>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                <span>LTP: <span className="text-slate-300">{runner.lastTradedPrice?.toFixed(2) || "-"}</span></span>
                <span>Vol: <span className="text-slate-300">{runner.matchedVolume.toLocaleString()}</span></span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  runner.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-300" :
                  runner.status === "WINNER" ? "bg-green-500/20 text-green-300" :
                  runner.status === "LOSER" ? "bg-red-500/20 text-red-300" :
                  "bg-slate-500/20 text-slate-300"
                }`}>
                  {runner.status}
                </span>
              </div>
            </div>
          </div>

          {/* Back price cells */}
          {backPrices.map((level, index) => {
            const key = `${runner.selectionId}-b-${index}`;
            const previousPrice = previousPrices[key];
            const flashDirection = previousPrice 
              ? level.price > previousPrice ? "up" : level.price < previousPrice ? "down" : null
              : null;
            
            return (
              <PriceCell
                key={key}
                price={level.price}
                size={level.size}
                tone="back"
                onClick={() => handlePick(runner.selectionId, "BACK", level.price)}
                hidden={index >= 2} // Hide on mobile for levels beyond first
                flashDirection={flashDirection}
              />
            );
          })}

          {/* Fill empty back cells if needed */}
          {Array.from({ length: maxPriceLevels - backPrices.length }).map((_, index) => (
            <div 
              key={`back-empty-${index}`} 
              className={`${index >= 2 ? 'max-md:hidden' : ''} bg-panel/50 p-2`}
            />
          ))}

          {/* Lay price cells */}
          {layPrices.map((level, index) => {
            const key = `${runner.selectionId}-l-${index}`;
            const previousPrice = previousPrices[key];
            const flashDirection = previousPrice 
              ? level.price > previousPrice ? "up" : level.price < previousPrice ? "down" : null
              : null;
            
            return (
              <PriceCell
                key={key}
                price={level.price}
                size={level.size}
                tone="lay"
                onClick={() => handlePick(runner.selectionId, "LAY", level.price)}
                hidden={index >= 2} // Hide on mobile for levels beyond first
                flashDirection={flashDirection}
              />
            );
          })}

          {/* Fill empty lay cells if needed */}
          {Array.from({ length: maxPriceLevels - layPrices.length }).map((_, index) => (
            <div 
              key={`lay-empty-${index}`} 
              className={`${index >= 2 ? 'max-md:hidden' : ''} bg-panel/50 p-2`}
            />
          ))}
        </div>
      );
    }),
    [runners, previousPrices, handlePick, maxPriceLevels]
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-panel shadow-lg">
      {header}
      <div className="max-h-[600px] overflow-y-auto">
        {runnerRows}
      </div>
      
      {/* Summary footer */}
      <div className="border-t border-line bg-panel/80 p-3 text-xs text-slate-400">
        <div className="flex justify-between">
          <span>Total Runners: {runners.length}</span>
          <span>Last Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </div>
    </div>
  );
}

// Export memoized version
export default memo(OddsLadderOptimized);