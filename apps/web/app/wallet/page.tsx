"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>();
  useEffect(() => { api("/api/wallet").then(setWallet).catch(() => null); }, []);
  return <section><h1 className="text-2xl font-black">Wallet</h1><div className="mt-5 grid gap-4 md:grid-cols-4">{["balance", "available", "exposure", "pnl"].map((key) => <div key={key} className="rounded-2xl border border-line bg-panel p-5"><p className="text-sm text-slate-400">{key}</p><b className="text-2xl">{wallet?.[key] ?? "0.00"}</b></div>)}</div></section>;
}
