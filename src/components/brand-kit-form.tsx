"use client";

import { useRouter } from "next/navigation";
import { Area, Button, Field, Select } from "./ui";

export function BrandKitForm({ presenters }: { presenters: { id: string; name: string }[] }) {
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    await fetch("/api/brand-kits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData.entries())),
    });
    router.refresh();
  }

  return (
    <form
      className="glass grid gap-4 rounded-3xl p-6 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(new FormData(e.currentTarget));
        e.currentTarget.reset();
      }}
    >
      <Field label="Kit name" name="name" required />
      <Field label="Business name" name="businessName" required />
      <Area label="Product information" name="productInfo" />
      <Field label="Website" name="website" />
      <Field label="Colours" name="colors" defaultValue="#0c0c14, #d4a853" />
      <Field label="Fonts" name="fonts" defaultValue="Fraunces, Outfit" />
      <Field label="Default CTA" name="defaultCta" defaultValue="Get started" />
      <Field label="Preferred voice" name="preferredVoice" />
      <Field label="Preferred video style" name="preferredStyle" />
      <Select label="Preferred presenter" name="preferredPresenterId">
        <option value="">None</option>
        {presenters.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </Select>
      <div className="md:col-span-2">
        <Button type="submit">Save Brand Kit</Button>
      </div>
    </form>
  );
}
