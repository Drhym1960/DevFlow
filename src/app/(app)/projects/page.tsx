import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SectionTitle } from "@/components/ui";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { status } = await searchParams;
  const projects = await db.project.findMany({
    where: { userId: user.id, ...(status ? { status } : {}) },
    orderBy: { updatedAt: "desc" },
  });
  const title =
    status === "draft" ? "Drafts" : status === "rendering" ? "Rendering" : status === "completed" ? "Completed Videos" : "My Projects";

  return (
    <div className="space-y-8">
      <SectionTitle kicker="Library" title={title} />
      <div className="space-y-3">
        {projects.map((p) => (
          <Link key={p.id} href={`/videos/${p.id}`} className="glass flex items-center justify-between rounded-2xl px-5 py-4">
            <div>
              <p>{p.title}</p>
              <p className="text-xs text-mist-500">{p.status} · {p.format} · {p.goal}</p>
            </div>
            <span className="text-sm text-gold-300">Open</span>
          </Link>
        ))}
        {projects.length === 0 ? <p className="text-sm text-mist-500">Nothing in this tray yet.</p> : null}
      </div>
    </div>
  );
}
