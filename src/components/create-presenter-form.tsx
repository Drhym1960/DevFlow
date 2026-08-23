"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ACCENTS, LANGUAGES, STUDIO_STYLES, TONES } from "@/lib/constants";
import { portraitDataUri } from "@/lib/presenters/portrait";
import { Area, Button, Field, Select } from "./ui";

const SKIN = [
  "Deep mahogany",
  "Rich espresso",
  "Deep bronze",
  "Warm olive",
  "Honey olive",
  "Warm tan",
  "Golden caramel",
  "Light gold",
  "Porcelain peach",
  "Fair warm",
  "Fair cool",
];

export function CreatePresenterForm({
  initial,
}: {
  initial?: Record<string, string>;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    gender: initial?.gender ?? "female",
    appearance: initial?.appearance ?? "",
    skinTone: initial?.skinTone ?? "Warm tan",
    hair: initial?.hair ?? "Long dark waves",
    ageRange: initial?.ageRange ?? "28-36",
    clothingStyle: initial?.clothingStyle ?? "Tailored studio look",
    professionalStyle: initial?.professionalStyle ?? "Brand ambassador",
    personality: initial?.personality ?? "Composed, memorable, commercially clear",
    voiceId: initial?.voiceId ?? "",
    accent: initial?.accent ?? "Neutral",
    languages: initial?.languages ?? "en",
    speakingTone: initial?.speakingTone ?? "Professional",
    studioStyle: initial?.studioStyle ?? STUDIO_STYLES[0],
    brandAssociation: initial?.brandAssociation ?? "",
  });
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const preview = useMemo(
    () =>
      portraitDataUri({
        name: form.name || "New Presenter",
        gender: form.gender,
        skinTone: form.skinTone,
        hair: form.hair,
        clothingStyle: form.clothingStyle,
        portraitSeed: `${form.name}:${form.skinTone}:${form.hair}`,
        studioStyle: form.studioStyle,
      }),
    [form],
  );

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setError("");
    if (photo) {
      const body = new FormData();
      body.append("photo", photo);
      body.append("name", form.name);
      body.append("gender", form.gender);
      body.append("brandAssociation", form.brandAssociation);
      const res = await fetch("/api/presenters/from-photo", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not create a motion presenter from that photo.");
        return;
      }
      router.push(`/presenters/${data.slug}`);
      router.refresh();
      return;
    }
    const res = await fetch(initial?.id ? `/api/presenters/${initial.id}` : "/api/presenters", {
      method: initial?.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save this presenter.");
      return;
    }
    router.push(`/presenters/${data.slug}`);
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <div className="glass overflow-hidden rounded-[28px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photoPreview || preview} alt="" className="aspect-[4/5] w-full object-cover" />
        <p className="p-4 text-sm text-mist-300">
          Upload a real photo to become the speaker, or design a fictional ambassador. The motion model animates that face.
        </p>
      </div>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <label className="md:col-span-2 block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-mist-500">Upload my photo (I will present)</span>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-mist-300"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setPhoto(file);
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
          <span className="block text-xs text-mist-500">A clear, front-facing photo. The motion model makes this face talk and move.</span>
        </label>
        <Field label="Presenter name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        <Select label="Gender" value={form.gender} onChange={(e) => set("gender", e.target.value)}>
          <option value="female">Female</option>
          <option value="male">Male</option>
        </Select>
        <Field label="General appearance" value={form.appearance} onChange={(e) => set("appearance", e.target.value)} />
        <Select label="Skin tone" value={form.skinTone} onChange={(e) => set("skinTone", e.target.value)}>
          {SKIN.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Field label="Hair" value={form.hair} onChange={(e) => set("hair", e.target.value)} />
        <Field label="Age range" value={form.ageRange} onChange={(e) => set("ageRange", e.target.value)} />
        <Field label="Clothing style" value={form.clothingStyle} onChange={(e) => set("clothingStyle", e.target.value)} />
        <Field label="Business style" value={form.professionalStyle} onChange={(e) => set("professionalStyle", e.target.value)} />
        <Area label="Personality" value={form.personality} onChange={(e) => set("personality", e.target.value)} />
        <Select label="Speaking tone" value={form.speakingTone} onChange={(e) => set("speakingTone", e.target.value)}>
          {TONES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Select label="Accent" value={form.accent} onChange={(e) => set("accent", e.target.value)}>
          {ACCENTS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
        <Select label="Main language" value={form.languages.split(",")[0]} onChange={(e) => set("languages", e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </Select>
        <Field label="Voice id" value={form.voiceId} onChange={(e) => set("voiceId", e.target.value)} hint="Mapped to the active TTS provider" />
        <Select label="Studio / background" value={form.studioStyle} onChange={(e) => set("studioStyle", e.target.value)}>
          {STUDIO_STYLES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Field label="Brand association" value={form.brandAssociation} onChange={(e) => set("brandAssociation", e.target.value)} />
        {error ? <p className="md:col-span-2 text-sm text-rose-300">{error}</p> : null}
        <div className="md:col-span-2">
          <Button type="submit">{initial?.id ? "Save presenter" : "Create brand ambassador"}</Button>
        </div>
      </form>
    </div>
  );
}
