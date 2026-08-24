"use client";

import { useEffect, useState } from "react";
import { PIPELINE_STAGES } from "@/lib/constants";

type Job = { id: string; status: string; stage: string; progress: number; error?: string | null };

export function RenderProgress({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    let alive = true;
    async function tick() {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok && alive) setJob(await res.json());
    }
    void tick();
    const id = setInterval(() => void tick(), 1500);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [jobId]);

  if (!job) return <p className="text-sm text-mist-500">Waiting for the render desk…</p>;

  return (
    <div className="space-y-4">
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full bg-gold-400 transition-all" style={{ width: `${job.progress}%` }} />
      </div>
      <ol className="space-y-2 text-sm">
        {PIPELINE_STAGES.map((s) => (
          <li key={s.id} className={job.stage === s.id ? "text-gold-300" : "text-mist-500"}>
            {s.label}
          </li>
        ))}
      </ol>
      {job.error ? <p className="text-sm text-rose-300">{job.error}</p> : null}
    </div>
  );
}
