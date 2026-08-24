import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "gold",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "gold" | "ghost" | "ink" }) {
  const look = {
    gold: "bg-gold-400 text-ink-950 hover:bg-gold-300",
    ghost: "bg-white/5 text-mist-100 hover:bg-white/10 border border-white/10",
    ink: "bg-ink-800 text-mist-100 hover:bg-ink-700 border border-white/10",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition disabled:opacity-50",
        look,
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-mist-500">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-ink-900 px-4 py-3 text-sm text-mist-100 outline-none ring-gold-400/40 focus:ring-2"
        {...props}
      />
      {hint ? <span className="block text-xs text-mist-500">{hint}</span> : null}
    </label>
  );
}

export function Area({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-mist-500">{label}</span>
      <textarea
        className="min-h-32 w-full rounded-2xl border border-white/10 bg-ink-900 px-4 py-3 text-sm text-mist-100 outline-none ring-gold-400/40 focus:ring-2"
        {...props}
      />
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-mist-500">{label}</span>
      <select
        className="w-full rounded-2xl border border-white/10 bg-ink-900 px-4 py-3 text-sm text-mist-100 outline-none"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Pill({ children, active }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs",
        active ? "border-gold-400/50 bg-gold-400/10 text-gold-300" : "border-white/10 text-mist-300",
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({ kicker, title, copy }: { kicker?: string; title: string; copy?: string }) {
  return (
    <div className="max-w-2xl space-y-3">
      {kicker ? <p className="text-xs uppercase tracking-[0.28em] text-gold-400">{kicker}</p> : null}
      <h2 className="font-display text-3xl tracking-tight text-mist-100 md:text-4xl">{title}</h2>
      {copy ? <p className="text-sm leading-7 text-mist-300">{copy}</p> : null}
    </div>
  );
}
