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
        copy="Upload samples of the Play Store or App Store style you want, then upload the real screens from your app. The studio keeps your original UI and frames it to match."
      />
      <StoreShotsForm />
    </div>
  );
}
