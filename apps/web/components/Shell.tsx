"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";
  return <div className="min-h-screen bg-[#e9e9e9] text-[#001f46]">
    {!isLogin && <header className="sticky top-0 z-30 shadow-md">
      <div className="flex min-h-20 items-center justify-between gap-3 bg-gradient-to-r from-[#2856a5] to-[#3298d2] px-3 py-2 md:px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="grid size-14 place-items-center rounded-full border border-white/25 bg-white/15 shadow-inner">
            <div className="size-9 rounded-full bg-[linear-gradient(135deg,#ffd6a2_0_35%,#1a7e9d_36%_60%,#f06b6b_61%)]" />
          </div>
          <div className="hidden text-white sm:block">
            <p className="text-xs uppercase tracking-[0.25em] text-white/70">Exchange</p>
            <h1 className="text-xl font-black leading-none">ExchangePro</h1>
          </div>
        </Link>
        <div className="ml-auto flex items-center gap-2 md:gap-3">
          <AccountBox label="BAL" value="540" />
          <AccountBox label="EXP" value="0" light />
          <button className="flex min-w-28 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-4 font-black text-white shadow-inner backdrop-blur md:min-w-40">C85944 <span className="text-xl leading-none">v</span></button>
        </div>
      </div>
      <div className="flex items-center gap-4 bg-[#163f6a] px-4 py-2 text-white shadow-inner">
        <span className="rounded-full bg-[#ffc928] px-5 py-1 font-black text-[#001f46] shadow">NEW</span>
        <div className="min-w-0 flex-1 overflow-hidden text-right font-black text-[#fff2c7]">
          <div className="truncate">ExchangePro par fast cricket, odds aur wallet updates</div>
        </div>
      </div>
    </header>}
    <main className={isLogin ? "" : "p-3 md:p-5"}>{children}</main>
  </div>;
}

function AccountBox({ label, value, light }: { label: string; value: string; light?: boolean }) {
  return <div className={`hidden min-w-28 rounded-xl border border-white/15 px-3 py-3 shadow-inner sm:block md:min-w-40 ${light ? "bg-white/90 text-[#001f46]" : "bg-white/10 text-white"}`}>
    <p className="text-xs font-medium opacity-80">{label}</p>
    <p className="text-xl font-black leading-none">{value}</p>
  </div>;
}
