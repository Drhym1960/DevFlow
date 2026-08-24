import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/plans";
import { Button, SectionTitle } from "@/components/ui";

export default async function BillingPage() {
  const user = await requireUser();

  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Billing"
        title="Plans that cap ambassadors, films and finish quality."
        copy="Limits are enforced in the application. Stripe checkout activates when STRIPE_SECRET_KEY is configured."
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {Object.values(PLANS).map((plan) => (
          <article key={plan.id} className={`glass rounded-3xl p-6 ${user.plan === plan.id ? "ring-1 ring-gold-400" : ""}`}>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-400">{plan.name}</p>
            <p className="mt-2 font-display text-4xl">{plan.price}</p>
            <p className="mt-2 text-sm text-mist-300">{plan.blurb}</p>
            <ul className="mt-4 space-y-1 text-sm text-mist-300">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <form
              action={async () => {
                "use server";
                await db.user.update({ where: { id: user.id }, data: { plan: plan.id } });
              }}
            >
              <Button className="mt-5" variant={user.plan === plan.id ? "ink" : "gold"}>
                {user.plan === plan.id ? "Current plan" : "Switch plan"}
              </Button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
