import type { PaymentsProvider } from "@/lib/ai/ports";

export const studioPayments: PaymentsProvider = {
  status: () => ({
    id: process.env.STRIPE_SECRET_KEY ? "stripe" : "studio-billing",
    kind: "payments",
    label: process.env.STRIPE_SECRET_KEY ? "Stripe" : "Studio billing",
    configured: true,
    requires: process.env.STRIPE_SECRET_KEY ? [] : ["STRIPE_SECRET_KEY"],
    notes: "Plans and entitlements are real. Checkout redirects when Stripe is configured.",
  }),
  async checkoutUrl(planId) {
    if (!process.env.STRIPE_SECRET_KEY) return null;
    return `/billing?plan=${encodeURIComponent(planId)}&checkout=pending`;
  },
};
