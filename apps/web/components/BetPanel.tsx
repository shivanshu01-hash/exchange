"use client";
import { useState } from "react";
import { api } from "@/lib/api";

export function BetPanel({ marketId, selectionId, side, price }: { marketId: string; selectionId?: string; side: "BACK" | "LAY"; price?: number }) {
  const [stake, setStake] = useState(10);
  const [message, setMessage] = useState("");
  const liability = side === "LAY" && price ? (price - 1) * stake : stake;
  async function submit() {
    if (!selectionId || !price) return;
    try {
      await api("/api/orders", { method: "POST", body: JSON.stringify({ marketId, selectionId, side, price, stake, clientOrderId: crypto.randomUUID() }) });
      setMessage("Order accepted");
    } catch (err) { setMessage(err instanceof Error ? err.message : "Rejected"); }
  }
  return <div className={`rounded-2xl border ${side === "BACK" ? "border-back/40 bg-back/10" : "border-lay/40 bg-lay/10"} p-4`}>
    <h3 className="font-bold">{side} Ticket</h3>
    <p className="mt-1 text-sm text-slate-400">Selection {selectionId || "-"} at {price || "-"}</p>
    <label className="mt-4 block text-sm text-slate-300">Stake</label>
    <input value={stake} onChange={(event) => setStake(Number(event.target.value))} type="number" className="mt-1 w-full rounded-xl border border-line bg-ink px-3 py-2 outline-none focus:border-back" />
    <div className="mt-3 flex justify-between text-sm"><span>Liability</span><b>{liability.toFixed(2)}</b></div>
    <button onClick={submit} className="mt-4 w-full rounded-xl bg-white px-4 py-3 font-bold text-ink">Place {side}</button>
    {message && <p className="mt-3 text-sm text-slate-300">{message}</p>}
  </div>;
}
