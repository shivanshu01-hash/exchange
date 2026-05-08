"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type MatchStatus = "Live" | "Upcoming" | "Recent";

type MatchData = {
  id: string;
  title: string;
  subtitle: string;
  status: MatchStatus;
  matchType: string;
  startDate: string;
  teams: [string, string];
  score: [string, string];
  runRate?: string;
};

type OddData = {
  title: string;
  runs: string;
  layOdds: number;
  backOdds: number;
  marketId: string;
};

export default function CricketLivePage() {
  const [tab, setTab] = useState<MatchStatus>("Live");
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await api<{ matches: MatchData[] }>(`/api/cricket/${tab.toLowerCase()}?limit=10`);
        setMatches(response.matches || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matches");
        console.error("Error fetching matches:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [tab]);

  return (
    <section className="max-w-4xl mx-auto">
      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["Live", "Upcoming", "Recent"] as MatchStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setTab(status)}
            className={`px-6 py-3 rounded-full font-bold text-sm transition-all ${tab === status ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300"}`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Match list */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">Loading matches...</div>
        ) : error ? (
          <div className="text-red-400 p-4 border border-red-500/30 rounded-lg bg-red-900/20">
            Error loading matches. {error}
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No matches found</div>
        ) : (
          matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))
        )}
      </div>
    </section>
  );
}

function MatchCard({ match }: { match: MatchData }) {
  const isLive = match.status === "Live";
  const matchTitle = match.subtitle || match.title;

  return (
    <Link href={`/cricket/${match.status.toLowerCase()}/${match.id}`} className="block">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-blue-500 transition-all">
        {/* Match header */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLive ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
            {match.status}
          </span>
          <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">T-20</span>
        </div>

        {/* Match title */}
        <h3 className="text-white font-bold text-lg mb-2">{matchTitle}</h3>

        {/* Match info */}
        <div className="bg-slate-700 rounded-lg p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-green-400">📅</div>
            <div>
              <div className="text-xs text-slate-400 uppercase">MATCH TIME</div>
              <div className="text-white font-semibold">{new Date(match.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400 uppercase text-right">STATUS</div>
            <div className="text-white font-semibold text-right">{match.score.join(' - ')}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
