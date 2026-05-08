"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  async function login() {
    try {
      const data = await api<{ token: string }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("token", data.token);
      router.push("/dashboard");
    } catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
  }
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#12345f,transparent_35%),#05070b] p-4">
    <div className="w-full max-w-md rounded-3xl border border-line bg-panel/90 p-8 shadow-2xl shadow-black/50">
      <p className="text-xs uppercase tracking-[0.35em] text-back">Secure Exchange</p><h1 className="mt-3 text-3xl font-black">Login</h1>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-8 w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none focus:border-back" />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-3 w-full rounded-xl border border-line bg-ink px-4 py-3 outline-none focus:border-back" />
      <button onClick={login} className="mt-5 w-full rounded-xl bg-back px-4 py-3 font-bold text-white">Enter Trading Floor</button>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
    </div>
  </div>;
}
