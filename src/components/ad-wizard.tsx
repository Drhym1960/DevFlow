"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FORMATS, GOALS, LANGUAGES, MUSIC_BEDS, TONES } from "@/lib/constants";
import { portraitDataUri } from "@/lib/presenters/portrait";
import { Area, Button, Field, Pill, Select } from "./ui";

type Presenter = {
  id: string;
  name: string;
  slug: string;
  isCustom: boolean;
  categories: string;
  voiceId: string;
  languages: string;
  speakingTone: string;
  professionalStyle: string;
  gender: string;
  skinTone: string;
  hair: string;
  clothingStyle: string;
  portraitSeed: string;
  studioStyle: string;
};

type Kit = { id: string; name: string; businessName: string; productInfo: string; website: string | null; defaultCta: string; colors: string };

type Script = {
  headline: string;
  voiceover: string;
  beats: { id: string; line: string; visual: string }[];
  cta: string;
  captions: string;
  language: string;
  provider: string;
};

export function AdWizard({
  presenters,
  kits,
  presetPresenter,
}: {
  presenters: Presenter[];
  kits: Kit[];
  presetPresenter?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState<"library" | "mine" | "me">("library");
  const [selfNote, setSelfNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [script, setScript] = useState<Script | null>(null);
  const [form, setForm] = useState({
    business: "",
    product: "",
    website: "",
    extra: "",
    colors: "#0c0c14, #d4a853, #f4f1ea",
    presenterId: presetPresenter ?? presenters[0]?.id ?? "",
    goal: "app-promo",
    format: "vertical",
    language: "en",
    tone: "Professional",
    music: "cinematic-warm",
    brandKitId: "",
  });

  const selected = presenters.find((p) => p.id === form.presenterId);
  const visible = presenters.filter((p) => (tab === "mine" ? p.isCustom : !p.isCustom));

  async function persist(status = "draft") {
    const payload = {
      title: form.business || "Untitled film",
      status,
      format: form.format,
      goal: form.goal,
      language: form.language,
      voiceTone: form.tone,
      music: form.music,
      presenterId: form.presenterId,
      brandKitId: form.brandKitId || null,
      brief: {
        business: form.business,
        product: form.product,
        website: form.website,
        extra: form.extra,
        colors: form.colors.split(",").map((s) => s.trim()),
      },
    };
    const res = await fetch(projectId ? `/api/projects/${projectId}` : "/api/projects", {
      method: projectId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not save");
    setProjectId(data.id);
    return data.id as string;
  }

  async function analyze() {
    setBusy(true);
    setError("");
    try {
      const id = await persist("analyzing");
      const res = await fetch(`/api/projects/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setScript(data.script);
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  async function rewrite(instruction: string) {
    if (!projectId) return;
    setBusy(true);
    const res = await fetch(`/api/projects/${projectId}/script`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction, script }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) setScript(data.script);
  }

  async function render() {
    if (!projectId || !script) return;
    setBusy(true);
    await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script, status: "composing" }),
    });
    const res = await fetch(`/api/projects/${projectId}/render`, { method: "POST" });
    setBusy(false);
    if (res.ok) router.push(`/videos/${projectId}`);
  }

  const steps = ["Brief", "Brand", "Presenter", "Goal", "Understand", "Script"];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {steps.map((label, i) => (
          <button key={label} onClick={() => setStep(i + 1)} className="text-left">
            <Pill active={step === i + 1}>
              {i + 1} {label}
            </Pill>
          </button>
        ))}
      </div>

      {step === 1 && (
        <div className="grid gap-4">
          <Field label="Business name" value={form.business} onChange={(e) => setForm({ ...form, business: e.target.value })} />
          <Area label="What are you advertising?" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          <Field label="Website URL" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} hint="Fetched when technically reachable" />
          <Area label="Campaign notes" value={form.extra} onChange={(e) => setForm({ ...form, extra: e.target.value })} />
          {kits.length ? (
            <Select label="Or start from a Brand Kit" value={form.brandKitId} onChange={(e) => {
              const kit = kits.find((k) => k.id === e.target.value);
              setForm({
                ...form,
                brandKitId: e.target.value,
                business: kit?.businessName || form.business,
                product: kit?.productInfo || form.product,
                website: kit?.website || form.website,
              });
            }}>
              <option value="">None</option>
              {kits.map((k) => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </Select>
          ) : null}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-mist-300">Upload logos, product photos, screenshots and brand colours. These become scenes — not decorations.</p>
          <Field label="Brand colours" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} />
          <UploadBox projectHint={form.business} />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setTab("library")}><Pill active={tab === "library"}>Realistic model</Pill></button>
            <button onClick={() => setTab("mine")}><Pill active={tab === "mine"}>My Presenter</Pill></button>
            <button onClick={() => setTab("me")}><Pill active={tab === "me"}>I will present</Pill></button>
          </div>
          {tab === "me" ? (
            <label className="glass block cursor-pointer rounded-3xl p-8 text-center">
              <p className="font-display text-xl">Upload your photo</p>
              <p className="mt-2 text-sm text-mist-500">
                A director who cannot be on set can still be the speaker. We animate your face to the script, with product screens beside you.
              </p>
              <input
                className="mt-4 block w-full text-sm"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const body = new FormData();
                  body.append("photo", file);
                  body.append("name", form.business ? `${form.business} director` : "Director");
                  const res = await fetch("/api/presenters/from-photo", { method: "POST", body });
                  const data = await res.json();
                  if (res.ok) {
                    setForm((f) => ({ ...f, presenterId: data.id }));
                    setSelfNote(`Motion presenter ready: ${data.name}`);
                  } else {
                    setSelfNote(data.error ?? "Upload failed");
                  }
                }}
              />
              {selfNote ? <p className="mt-3 text-xs text-gold-300">{selfNote}</p> : null}
            </label>
          ) : null}
          {tab !== "me" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <button
                key={p.id}
                onClick={() => setForm({ ...form, presenterId: p.id })}
                className={`glass overflow-hidden rounded-3xl text-left ${form.presenterId === p.id ? "ring-2 ring-gold-400" : ""}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={portraitDataUri(p)} alt={p.name} className="aspect-[4/5] w-full object-cover" />
                <div className="space-y-1 p-4">
                  <p className="font-display text-xl">{p.name}</p>
                  <p className="text-xs text-mist-500">{p.voiceId} · {p.languages} · {p.speakingTone}</p>
                  <p className="text-xs text-gold-300">Short demo: {p.professionalStyle}</p>
                </div>
              </button>
            ))}
          </div> : null}
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Marketing goal" value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })}>
            {GOALS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </Select>
          <Select label="Format" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label} — {f.hint}</option>
            ))}
          </Select>
          <Select label="Language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </Select>
          <Select label="Speaking tone" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
            {TONES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Select label="Music" value={form.music} onChange={(e) => setForm({ ...form, music: e.target.value })}>
            {MUSIC_BEDS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </Select>
        </div>
      )}

      {step === 5 && (
        <div className="glass space-y-4 rounded-3xl p-6">
          <p className="font-display text-2xl">The studio will now understand the product.</p>
          <p className="text-sm leading-7 text-mist-300">
            It determines what you sell, who it is for, the strongest benefits, the right tone, which assets to show, and
            the call to action. Then it writes advertising copy — it will not simply repeat your description.
          </p>
          {selected ? <p className="text-sm text-gold-300">Presenter: {selected.name}</p> : null}
          <Button disabled={busy} onClick={() => void analyze()}>
            {busy ? "Analyzing…" : "Analyze and write the script"}
          </Button>
        </div>
      )}

      {step === 6 && script && (
        <div className="space-y-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-400">Written by {script.provider}</p>
          <h2 className="font-display text-3xl">{script.headline}</h2>
          <Area label="Voiceover" value={script.voiceover} onChange={(e) => setScript({ ...script, voiceover: e.target.value })} />
          <Field label="Call to action" value={script.cta} onChange={(e) => setScript({ ...script, cta: e.target.value })} />
          <div className="flex flex-wrap gap-2">
            {[
              "Make it shorter",
              "Make it longer",
              "Make it more professional",
              "Make it more energetic",
              "Rewrite with AI",
              "Regenerate",
              "Translate",
            ].map((instruction) => (
              <Button key={instruction} variant="ghost" disabled={busy} onClick={() => void rewrite(instruction)}>
                {instruction}
              </Button>
            ))}
          </div>
          <ol className="space-y-2 text-sm text-mist-300">
            {script.beats.map((b) => (
              <li key={b.id} className="glass rounded-2xl p-4">
                <p>{b.line}</p>
                <p className="text-xs text-mist-500">{b.visual}</p>
              </li>
            ))}
          </ol>
          <Button disabled={busy} onClick={() => void render()}>
            {busy ? "Sending to the render desk…" : "Compose and render advertisement"}
          </Button>
        </div>
      )}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {step < 5 ? (
          <Button onClick={() => setStep((s) => s + 1)}>Continue</Button>
        ) : null}
      </div>
    </div>
  );
}

function UploadBox({ projectHint }: { projectHint: string }) {
  const [note, setNote] = useState("");
  const label = useMemo(() => projectHint || "this brand", [projectHint]);
  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const body = new FormData();
    for (const file of Array.from(files)) body.append("files", file);
    body.append("kind", "product");
    const res = await fetch("/api/assets", { method: "POST", body });
    setNote(res.ok ? `Stored ${files.length} asset${files.length > 1 ? "s" : ""} for ${label}` : "Upload failed");
  }
  return (
    <label className="glass block cursor-pointer rounded-3xl p-8 text-center">
      <p className="font-display text-xl">Drop brand materials</p>
      <p className="mt-2 text-sm text-mist-500">Logo, product photos, app screenshots, existing clips, graphics</p>
      <input className="hidden" type="file" multiple onChange={(e) => void onFiles(e.target.files)} />
      {note ? <p className="mt-3 text-xs text-gold-300">{note}</p> : null}
    </label>
  );
}
