"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });
    setPending(false);
    if (!res.ok) {
      setError("Those details did not match a studio account.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="text-xs uppercase tracking-[0.28em] text-gold-400">DevFlow Studio</p>
      <h1 className="mt-3 font-display text-4xl">Sign in</h1>
      <form
        className="mt-8 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void onSubmit(new FormData(e.currentTarget));
        }}
      >
        <Field label="Email" name="email" type="email" defaultValue="studio@devflow.ai" required />
        <Field label="Password" name="password" type="password" defaultValue="studio1234" required />
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <Button disabled={pending}>{pending ? "Opening…" : "Enter the studio"}</Button>
      </form>
      <p className="mt-6 text-sm text-mist-500">
        New here? <Link href="/register" className="text-gold-300">Create an account</Link>
      </p>
    </main>
  );
}
