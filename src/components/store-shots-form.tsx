"use client";

import { useState } from "react";
import { STORE_FORMATS } from "@/lib/store-shots/sizes";
import { Area, Button, Field, Select } from "./ui";

type Shot = { id: string; url: string; headline: string; width: number; height: number };

export function StoreShotsForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);

  async function onSubmit(form: HTMLFormElement) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/store-shots", { method: "POST", body: new FormData(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not compose those store screenshots.");
      setShots(data.shots ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compose those store screenshots.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(e.currentTarget);
        }}
      >
        <Select label="Store" name="store" defaultValue="play">
          {Object.values(STORE_FORMATS).map((s) => (
            <option key={s.id} value={s.id}>
              {s.label} — {s.hint}
            </option>
          ))}
        </Select>
        <Field label="App name" name="appName" placeholder="MysticTxt" required />
        <div className="md:col-span-2">
          <Area
            label="What the app does"
            name="notes"
            placeholder="Private live chat with advisors. Voice when you are ready."
          />
        </div>
        <div className="md:col-span-2">
          <Area
            label="Headlines (optional, one per screenshot)"
            name="captions"
            placeholder={"Talk privately\nVoice when you are ready"}
          />
        </div>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-mist-500">Sample look you want</span>
          <input className="w-full text-sm text-mist-300" type="file" name="samples" accept="image/*" multiple />
          <span className="block text-xs text-mist-500">
            Upload Play Store or App Store shots you like. The studio reads colour and mood from these. It does not copy
            another app’s UI.
          </span>
        </label>
        <label className="block space-y-2">
          <span className="text-xs uppercase tracking-[0.18em] text-mist-500">Your real app screenshots</span>
          <input className="w-full text-sm text-mist-300" type="file" name="screens" accept="image/*" multiple required />
          <span className="block text-xs text-mist-500">
            These stay on the phone. AI frames them. It does not redraw your interface.
          </span>
        </label>
        <div className="md:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Framing your screens…" : "Make store screenshots"}
          </Button>
        </div>
      </form>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      {shots.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shots.map((shot) => (
            <article key={shot.id} className="glass overflow-hidden rounded-3xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={shot.url} alt={shot.headline} className="aspect-[9/16] w-full object-cover" />
              <div className="space-y-2 p-4">
                <p className="text-sm">{shot.headline}</p>
                <p className="text-xs text-mist-500">
                  {shot.width} × {shot.height}
                </p>
                <a className="text-sm text-gold-300" href={shot.url} download>
                  Download PNG
                </a>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
