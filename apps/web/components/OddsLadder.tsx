"use client";
import type { RunnerPrice } from "@exchange/shared";
import { useRef } from "react";

export function OddsLadder({ runners, onPick }: { runners: RunnerPrice[]; onPick: (selectionId: string, side: "BACK" | "LAY", price: number) => void }) {
  const previous = useRef<Record<string, number>>({});
  return <div className="overflow-hidden rounded-2xl border border-line bg-panel">
    <div className="grid grid-cols-[1fr_repeat(6,70px)] gap-px bg-line text-xs text-slate-400 max-md:grid-cols-[1fr_repeat(2,70px)]">
      <div className="bg-panel p-3">Runner</div><div className="bg-panel p-3 max-md:hidden">Back 3</div><div className="bg-panel p-3 max-md:hidden">Back 2</div><div className="bg-panel p-3">Back</div><div className="bg-panel p-3">Lay</div><div className="bg-panel p-3 max-md:hidden">Lay 2</div><div className="bg-panel p-3 max-md:hidden">Lay 3</div>
    </div>
    {runners.map((runner) => <div key={runner.selectionId} className="grid grid-cols-[1fr_repeat(6,70px)] gap-px border-t border-line bg-line max-md:grid-cols-[1fr_repeat(2,70px)]">
      <div className="bg-panel p-3"><b>Selection {runner.selectionId}</b><p className="text-xs text-slate-500">LTP {runner.lastTradedPrice || "-"} Vol {runner.matchedVolume}</p></div>
      {[...runner.back].reverse().map((level, index) => <PriceCell key={`b-${index}`} id={`${runner.selectionId}-b-${index}`} level={level} tone="back" previous={previous.current} onClick={() => onPick(runner.selectionId, "BACK", level.price)} hidden={index < 2} />)}
      {runner.lay.map((level, index) => <PriceCell key={`l-${index}`} id={`${runner.selectionId}-l-${index}`} level={level} tone="lay" previous={previous.current} onClick={() => onPick(runner.selectionId, "LAY", level.price)} hidden={index > 0} />)}
    </div>)}
  </div>;
}

function PriceCell({ id, level, tone, previous, onClick, hidden }: { id: string; level?: { price: number; size: number }; tone: "back" | "lay"; previous: Record<string, number>; onClick: () => void; hidden?: boolean }) {
  const old = previous[id];
  const cls = old && level ? level.price > old ? "flash-up" : level.price < old ? "flash-down" : "" : "";
  if (level) previous[id] = level.price;
  const toneClass = tone === "back" ? "bg-back/20 hover:bg-back/40" : "bg-lay/20 hover:bg-lay/40";
  return <button onClick={onClick} className={`${hidden ? "max-md:hidden" : ""} ${cls} ${toneClass} p-2 text-center`}><b>{level?.price || "-"}</b><p className="text-[11px] text-slate-300">{level?.size || ""}</p></button>;
}
