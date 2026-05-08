"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type CricketTab = "live" | "recent" | "upcoming" | "odds";

const tabs: CricketTab[] = ["live", "recent", "upcoming", "odds"];

export default function InPlayPage() {
  const [tab, setTab] = useState<CricketTab>("live");
  const [data, setData] = useState<unknown>();
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api(`/api/cricket/${tab}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load cricket feed"));
  }, [tab]);

  return <section>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-back">Cricbuzz RapidAPI Feed</p>
        <h1 className="mt-1 text-2xl font-black">In-Play Cricket</h1>
      </div>
      <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm text-emerald-200">Redis cached</span>
    </div>

    <div className="mt-5 flex gap-2 overflow-x-auto">
      {tabs.map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-xl px-4 py-2 text-sm font-bold capitalize ${tab === item ? "bg-back text-white" : "border border-line bg-panel text-slate-300"}`}>{item}</button>)}
    </div>

    <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
      <div className="rounded-2xl border border-line bg-panel p-4">
        <h2 className="font-bold capitalize">{tab} data</h2>
        {error ? <p className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-100">{error}. Add the full `RAPIDAPI_KEY` in `.env` to enable this feed.</p> : <pre className="mt-4 max-h-[65vh] overflow-auto rounded-xl bg-ink p-4 text-xs text-slate-300">{JSON.stringify(data ?? { loading: true }, null, 2)}</pre>}
      </div>
      <aside className="space-y-4">
        <InfoCard title="Live scores" text="Use /api/cricket/live and /api/cricket/matches/:matchId/scorecard." />
        <InfoCard title="Commentary" text="Use /api/cricket/matches/:matchId/commentary for live text commentary." />
        <InfoCard title="Ball-by-ball" text="Use /api/cricket/matches/:matchId/ball-by-ball for over and delivery feed when supported by the provider." />
        <InfoCard title="Odds" text="Odds come from this exchange market cache, not the Cricbuzz score API." />
      </aside>
    </div>
  </section>;
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-line bg-panel p-4"><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm text-slate-400">{text}</p></div>;
}
