import { requireUser } from "@/lib/auth";
import { providerRoster } from "@/lib/ai/registry";
import { getPlan } from "@/lib/plans";
import { Button, SectionTitle } from "@/components/ui";

export default async function AccountPage() {
  const user = await requireUser();
  const plan = getPlan(user.plan);
  const providers = providerRoster();

  return (
    <div className="space-y-8">
      <SectionTitle kicker="Account" title={user.name} copy={user.email} />
      <div className="glass rounded-3xl p-6">
        <p className="text-sm text-mist-300">{user.company || "Independent studio"} · {plan.name}</p>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <Button variant="ghost" type="submit">Sign out</Button>
        </form>
      </div>
      <div>
        <h3 className="mb-4 font-display text-2xl">AI provider roster</h3>
        <div className="space-y-2">
          {providers.map((p) => (
            <div key={p.id} className="glass flex items-center justify-between rounded-2xl px-4 py-3 text-sm">
              <div>
                <p>{p.label}</p>
                <p className="text-xs text-mist-500">{p.notes}</p>
              </div>
              <span className={p.configured ? "text-gold-300" : "text-mist-500"}>
                {p.configured ? "Ready" : `Needs ${p.requires?.join(", ")}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
