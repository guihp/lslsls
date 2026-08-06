"use client";

import { signOut, updatePassword } from "@/app/actions/auth";
import {
  removeAvatar,
  saveAvatarPath,
  updateProfile,
} from "@/app/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AVATAR_ACCEPT,
  prepareAvatarImage,
  validateAvatarFile,
} from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { Camera, Lock, Mail, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

function uploadErrorMessage(message: string): string {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("row-level security") ||
    normalized.includes("unauthorized") ||
    normalized.includes("jwt")
  ) {
    return "Sem permissão para enviar a foto. Faça login novamente e tente de novo.";
  }
  if (normalized.includes("exceeded") || normalized.includes("too large")) {
    return "A imagem excede o limite de tamanho do servidor.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "Falha de conexão ao enviar a imagem. Verifique sua internet e tente novamente.";
  }
  return `Não foi possível enviar a foto: ${message}`;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.full_name);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const busy = pending || uploading;

  function flash(ok: string | null, err: string | null) {
    setMessage(ok);
    setError(err);
  }

  async function handleAvatarChange(file: File) {
    const invalid = validateAvatarFile(file);
    if (invalid) {
      flash(null, invalid);
      return;
    }

    setUploading(true);
    flash("Enviando foto...", null);
    try {
      const { blob, contentType, extension } = await prepareAvatarImage(file);
      const path = `${profile.id}/avatar-${Date.now()}.${extension}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { contentType, upsert: true });

      if (uploadError) {
        flash(null, uploadErrorMessage(uploadError.message));
        return;
      }

      const res = await saveAvatarPath(path);
      if (res.error) {
        flash(null, res.error);
        return;
      }

      flash("Foto atualizada", null);
      router.refresh();
    } catch (err) {
      flash(
        null,
        uploadErrorMessage(err instanceof Error ? err.message : String(err)),
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Foto de Perfil</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Sua foto aparece nos comentários e na barra lateral.
        </p>
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-zinc-400" />
              )}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow disabled:opacity-60 dark:bg-zinc-700"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={AVATAR_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void handleAvatarChange(file);
              }}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Enviando..." : "Alterar foto"}
            </Button>
            {profile.avatar_url ? (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-red-500 disabled:opacity-60"
                disabled={busy}
                onClick={() =>
                  startTransition(async () => {
                    const res = await removeAvatar();
                    if (res.error) flash(null, res.error);
                    else {
                      flash("Foto removida", null);
                      router.refresh();
                    }
                  })
                }
              >
                <Trash2 className="h-4 w-4" /> Remover
              </button>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">
            JPG, PNG, GIF ou WebP. Máximo 10MB — a imagem é reduzida
            automaticamente antes do envio.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Informações Pessoais</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Atualize suas informações de perfil.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData();
            fd.set("full_name", fullName);
            startTransition(async () => {
              const res = await updateProfile(fd);
              if (res.error) flash(null, res.error);
              else {
                flash("Alterações salvas", null);
                router.refresh();
              }
            });
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">
              Nome completo
            </label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input value={profile.email} disabled className="pl-10 opacity-70" />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              O email não pode ser alterado
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-500">Função</label>
            <span className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm dark:bg-zinc-800">
              <User className="h-4 w-4" />
              {profile.job_title}
              {profile.is_admin ? " · Admin" : ""}
            </span>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Salvar alterações
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Segurança</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Gerencie a segurança da sua conta.
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium">Senha</p>
              <p className="text-sm text-zinc-500">Altere sua senha de acesso.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPassword((v) => !v)}
          >
            Alterar senha
          </Button>
        </div>
        {showPassword ? (
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData();
              fd.set("password", password);
              startTransition(async () => {
                const res = await updatePassword(fd);
                if (res.error) flash(null, res.error);
                else {
                  flash("Senha atualizada", null);
                  setPassword("");
                  setShowPassword(false);
                }
              });
            }}
          >
            <Input
              type="password"
              minLength={6}
              required
              placeholder="Nova senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy}>
              Salvar
            </Button>
          </form>
        ) : null}
      </section>

      {(message || error) && (
        <p className={`text-sm ${error ? "text-red-500" : "text-orange-600"}`}>
          {error || message}
        </p>
      )}

      <form action={signOut}>
        <Button type="submit" variant="ghost" className="w-full text-red-500">
          Sair da conta
        </Button>
      </form>
    </div>
  );
}
