import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getPlan } from "@/lib/plans";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/videos/new", label: "Create New Video" },
  { href: "/projects", label: "My Projects" },
  { href: "/presenters/mine", label: "My Presenters" },
  { href: "/presenters", label: "Presenter Library" },
  { href: "/brand-kits", label: "Brand Kits" },
  { href: "/projects?status=draft", label: "Drafts" },
  { href: "/projects?status=rendering", label: "Rendering" },
  { href: "/projects?status=completed", label: "Completed Videos" },
  { href: "/assets", label: "Uploaded Assets" },
  { href: "/templates", label: "Templates" },
  { href: "/account", label: "Account" },
  { href: "/billing", label: "Billing" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b border-white/10 md:border-b-0 md:border-r">
        <div className="sticky top-0 space-y-8 p-6">
          <Link href="/dashboard" className="block">
            <p className="text-[11px] uppercase tracking-[0.32em] text-gold-400">DevFlow</p>
            <p className="font-display text-2xl">Studio</p>
          </Link>
          <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-xl px-3 py-2 text-sm text-mist-300 hover:bg-white/5 hover:text-mist-100">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="glass rounded-2xl p-4 text-xs text-mist-300">
            <p className="text-mist-100">{user.name}</p>
            <p>{plan.name} · {user.videosUsed}/{plan.videosPerMonth} films</p>
          </div>
        </div>
      </aside>
      <main className="min-w-0 p-4 md:p-10">{children}</main>
    </div>
  );
}
