import Link from "next/link";

const cards = [
  { title: "In Play", href: "/in-play", icon: "cricket" },
  { title: "Casino", href: "/dashboard", icon: "casino" },
  { title: "Complete Games", href: "/matched-bets", icon: "complete" },
  { title: "My Profile", href: "/wallet", icon: "profile" },
  { title: "My Ledger", href: "/profit-loss", icon: "ledger" },
  { title: "Change Password", href: "/login", icon: "lock" },
];

export default function DashboardPage() {
  return (
    <section className="rounded-[28px] border border-[#9ccfff] bg-[#f8fbff] p-2 shadow-sm md:p-4">
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-4">
        {cards.map((card) => (
          <DashboardTile key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
}

function DashboardTile({
  title,
  href,
  icon,
}: {
  title: string;
  href: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-32 w-full items-center justify-center rounded-[18px] border border-[#9ccfff] bg-white p-3 text-center text-xs transition hover:-translate-y-0.5 hover:border-[#3298d2] hover:shadow-lg hover:shadow-[#3298d2]/10 sm:min-h-40 sm:rounded-[20px] md:min-h-48 md:p-4 md:text-sm"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="relative size-16 sm:size-20 md:size-24">
          <TileIcon type={icon} />
        </div>
        <h2 className="mt-2 text-sm font-bold tracking-tight text-[#001f46] sm:text-base md:text-lg">
          {title}
        </h2>
      </div>
    </Link>
  );
}

function TileIcon({ type }: { type: string }) {
  if (type === "cricket")
    return (
      <div className="relative mx-auto size-16 sm:size-20 md:size-24">
        <div className="absolute left-4 top-6 h-10 w-5 rotate-45 rounded-full bg-[#ffb000] sm:left-5 sm:top-7 sm:h-12 sm:w-6 md:left-6 md:top-8 md:h-14 md:w-7" />
        <div className="absolute left-7 top-4 h-12 w-4 -rotate-12 rounded-full bg-[#0d4da1] sm:left-8 sm:top-5 sm:h-14 sm:w-5 md:left-9 md:top-6 md:h-16 md:w-6" />
        <div className="absolute left-3 top-8 size-8 rounded-full border-[7px] border-[#e92828] border-r-transparent sm:left-4 sm:top-9 sm:size-9 md:left-4 sm:h-10 md:size-10" />
        <div className="absolute left-10 top-3 h-12 w-1.5 -rotate-45 rounded-full bg-[#0d4da1] sm:left-12 sm:top-4 md:left-14" />
      </div>
    );
  if (type === "casino")
    return (
      <div className="relative mx-auto size-16 sm:size-20 md:size-24">
        <div className="absolute inset-x-2 top-3 h-12 rounded-full bg-[#08164f] shadow-lg sm:inset-x-2 sm:top-3 sm:h-14 md:inset-x-2 md:top-4" />
        <div className="absolute inset-x-1 top-7 rounded-xl border-2 border-[#ffc928] bg-[#0b1d69] px-1 py-2 text-center text-xs font-bold tracking-wider text-[#ffc928] sm:inset-x-1 sm:top-8 sm:py-2.5 sm:text-sm md:inset-x-2 md:py-3 md:text-base">
          CASINO
        </div>
        <div className="absolute bottom-2 left-5 size-3.5 rounded-full bg-[#d51d2a] shadow sm:left-6 sm:size-4 md:left-7 md:size-5" />
        <div className="absolute bottom-2 right-5 size-3.5 rounded-full bg-[#d51d2a] shadow sm:right-6 sm:size-4 md:right-7 md:size-5" />
      </div>
    );
  if (type === "complete")
    return (
      <div className="relative mx-auto size-16 sm:size-20 md:size-24">
        {Array.from({ length: 8 }).map((_, index) => (
          <span
            key={index}
            className="absolute block size-10 rounded-full opacity-75 sm:size-11 md:size-12"
            style={{ transform: `rotate(${index * 45}deg) translateY(-14px)` }}
          />
        ))}
        <div className="z-10 mx-auto grid size-10 place-items-center rounded-full bg-white text-[8px] font-black text-slate-500 shadow sm:size-11 md:size-12 md:text-[10px]">
          COMPLETE
        </div>
      </div>
    );
  if (type === "profile")
    return (
      <div className="relative mx-auto size-16 sm:size-20 md:size-24">
        <div className="absolute left-6 top-5 size-6 rounded-full bg-[#ffe0bd] sm:left-7 md:left-8" />
        <div className="absolute left-4.5 top-4 h-6 w-10 rounded-t-full bg-[#9c5514] sm:left-5.5 md:left-6 md:h-7" />
        <div className="absolute bottom-0 left-[9px] h-8 w-12 rounded-t-full bg-[#16a085] sm:left-[11px] md:left-[13px] md:h-9" />
        <div className="absolute bottom-6 left-[29px] size-1 rounded-full bg-[#0b3058] shadow-[10px_0_0_#0b3058] sm:bottom-7 sm:left-[35px] md:bottom-8 md:left-[41px]" />
      </div>
    );
  if (type === "ledger")
    return (
      <div className="relative mx-auto size-16 sm:size-20 md:size-24">
        <div className="absolute left-1 top-4 size-10 rounded-full bg-[#5f57b2] opacity-90 sm:left-2 sm:size-11" />
        <div className="absolute right-1 top-4 size-10 rounded-full bg-[#4cc9f0] opacity-90 sm:right-2 sm:size-11" />
        <div className="absolute inset-x-4.5 top-2 h-14 rounded-full border-6 border-white bg-white/40 sm:inset-x-6 md:inset-x-7" />
        <div className="z-10 flex gap-2 text-2xl font-black text-white sm:text-2xl md:text-3xl">
          <span>C</span>
          <span>L</span>
        </div>
      </div>
    );
  return (
    <div className="relative mx-auto grid size-16 place-items-center rounded-full border-4 border-[#20aa92] bg-white sm:size-20 md:size-24">
      <div className="size-10 rounded-full border-5 border-[#52a9df] bg-white shadow-inner sm:size-11 md:size-12" />
      <div className="absolute top-3 h-5 w-6 rounded-t-full border-4 border-[#52a9df] border-b-0 sm:top-4 sm:h-6 sm:w-7" />
    </div>
  );
}
