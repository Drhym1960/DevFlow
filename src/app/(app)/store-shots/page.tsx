import { requireUser } from "@/lib/auth";
import { StoreShotsForm } from "@/components/store-shots-form";
import { SectionTitle } from "@/components/ui";

export default async function StoreShotsPage() {
  await requireUser();
  return (
    <div className="space-y-8">
      <SectionTitle
        kicker="Store screenshots"
        title="Your app. Their store look."
        copy="Paste your live website or upload real screens. The studio captures them on an iPhone 16 viewport and frames them for the App Store. Original UI stays on the phone. It does not redraw the interface."
      />
      <StoreShotsForm />
    </div>
  );
}
