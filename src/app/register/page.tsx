"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(formData: FormData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        company: formData.get("company"),
      }),
    });
    if (!res.ok) {
      setError("Could not create that account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.28em] text-gold-400">Begin</p>
      <h1 className="mt-3 font-display text-4xl">Open a studio</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Your name" name="name" required />
        <Field label="Business" name="company" />
        <Field label="Email" name="email" type="email" required />
        <Field label="Password" name="password" type="password" required minLength={8} />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button>Create account</Button>
      </form>
      <p className="mt-6 text-sm text-mist-500">
        Already filming? <Link href="/login" className="text-gold-300">Sign in</Link>
      </p>
    </main>
  );
}
