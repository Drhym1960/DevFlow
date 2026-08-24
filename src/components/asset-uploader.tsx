"use client";

import { useRouter } from "next/navigation";
import { ASSET_KINDS } from "@/lib/constants";
import { Button, Select } from "./ui";

export function AssetUploader() {
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    await fetch("/api/assets", { method: "POST", body: formData });
    router.refresh();
  }

  return (
    <form
      className="glass flex flex-wrap items-end gap-3 rounded-3xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(new FormData(e.currentTarget));
      }}
    >
      <Select label="Kind" name="kind">
        {ASSET_KINDS.map((k) => (
          <option key={k.id} value={k.id}>{k.label}</option>
        ))}
      </Select>
      <label className="text-sm text-mist-300">
        Files
        <input className="mt-2 block" type="file" name="files" multiple />
      </label>
      <Button type="submit">Upload</Button>
    </form>
  );
}
