import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AssetUploader } from "@/components/asset-uploader";
import { SectionTitle } from "@/components/ui";

export default async function AssetsPage() {
  const user = await requireUser();
  const assets = await db.asset.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-8">
      <SectionTitle kicker="Uploaded Assets" title="The raw material of every film." />
      <AssetUploader />
      <div className="grid gap-3 md:grid-cols-3">
        {assets.map((a) => (
          <article key={a.id} className="glass rounded-2xl p-4 text-sm">
            <p>{a.filename}</p>
            <p className="text-xs text-mist-500">{a.kind} · {a.mime}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
