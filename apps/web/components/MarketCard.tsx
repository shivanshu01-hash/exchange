"use client";
import type { MarketSnapshot } from "@exchange/shared";
import Link from "next/link";

export function MarketCard({ market }: { market: MarketSnapshot }) {
  const first = market.runners[0];
  return <Link href={`/matches/${market.marketId}`} className="block rounded-2xl border border-line bg-panel p-4 shadow-xl shadow-black/20 transition hover:border-back/50">
    <div className="flex items-start justify-between gap-3">
      <div><p className="text-xs uppercase tracking-[0.25em] text-slate-500">{market.marketName}</p><h3 className="mt-1 font-semibold">{market.eventName}</h3></div>
      <span className={`rounded-full px-2 py-1 text-xs ${market.status === "OPEN" ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>{market.status}</span>
    </div>
    <div className="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
      <div className="rounded-xl bg-back/15 p-3"><p className="text-slate-400">Best Back</p><b>{first?.back[0]?.price || "-"}</b></div>
      <div className="rounded-xl bg-lay/15 p-3"><p className="text-slate-400">Best Lay</p><b>{first?.lay[0]?.price || "-"}</b></div>
    </div>
  </Link>;
}
