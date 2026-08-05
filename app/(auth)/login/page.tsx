"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fff7f0] px-4 dark:bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,107,0,0.18),_transparent_55%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-orange-200/70 bg-white/95 p-8 shadow-lg shadow-orange-500/10 dark:border-orange-500/20 dark:bg-zinc-950">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-orange-200 dark:ring-orange-500/30">
            <BrandLogo size={56} priority />
          </div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Entrar
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Acesso restrito — contas criadas pelo ADMIN
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">Email</label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">Senha</label>
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Precisa de acesso? Peça ao ADMIN da equipe.
        </p>
        <p className="mt-2 text-center text-xs text-zinc-400">
          <Link href="/" className="hover:text-orange-500">
            IAFE Daily
          </Link>
        </p>
      </div>
    </div>
  );
}
