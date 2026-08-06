"use client";

import {
  createUserByAdmin,
  updateUserPermissions,
} from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import type { Profile, UserPermissions } from "@/lib/types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type UserRow = {
  profile: Profile;
  permissions: UserPermissions;
};

const FLAGS: {
  key: keyof Omit<UserPermissions, "user_id" | "updated_at">;
  label: string;
}[] = [
  { key: "can_view_dashboard", label: "Dashboard" },
  { key: "can_view_clientes", label: "Clientes" },
  { key: "can_view_documentos", label: "Documentos" },
  { key: "can_view_progresso", label: "Progresso" },
  { key: "can_view_admin", label: "Admin" },
  { key: "can_create_demand", label: "Criar demanda" },
];

export function AdminUsersPanel({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          Cadastro público desativado. Só ADMIN cria contas.
        </p>
        <Button type="button" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> Novo usuário
        </Button>
      </div>

      {(message || error) && (
        <p className={`text-sm ${error ? "text-red-500" : "text-orange-600"}`}>
          {error || message}
        </p>
      )}

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-orange-300/60 p-10 text-center text-zinc-500 dark:border-orange-500/30">
          Nenhum usuário cadastrado ainda.
        </div>
      ) : (
        users.map(({ profile, permissions }) => (
          <div
            key={profile.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold">{profile.full_name}</h3>
                <p className="text-sm text-zinc-500">{profile.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex w-full flex-col gap-1 text-sm text-zinc-500 sm:w-auto sm:flex-row sm:items-center">
                  Cargo
                  <input
                    className="w-full rounded-lg border border-zinc-300 bg-transparent px-2 py-1.5 text-sm sm:ml-2 sm:w-auto dark:border-zinc-700"
                    defaultValue={profile.job_title}
                    disabled={pending}
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (!value || value === profile.job_title) return;
                      startTransition(async () => {
                        await updateUserPermissions(profile.id, {
                          job_title: value,
                        });
                        router.refresh();
                      });
                    }}
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    defaultChecked={profile.is_admin}
                    disabled={pending || profile.id === currentUserId}
                    onChange={(e) => {
                      startTransition(async () => {
                        await updateUserPermissions(profile.id, {
                          is_admin: e.target.checked,
                          ...(e.target.checked
                            ? {
                                can_view_dashboard: true,
                                can_view_clientes: true,
                                can_view_documentos: true,
                                can_view_progresso: true,
                                can_view_admin: true,
                                can_create_demand: true,
                              }
                            : {}),
                        });
                        router.refresh();
                      });
                    }}
                  />
                  ADMIN
                </label>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FLAGS.map((flag) => (
                <label
                  key={flag.key}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <input
                    type="checkbox"
                    defaultChecked={permissions[flag.key]}
                    disabled={pending || profile.is_admin}
                    onChange={(e) => {
                      startTransition(async () => {
                        await updateUserPermissions(profile.id, {
                          [flag.key]: e.target.checked,
                        });
                        router.refresh();
                      });
                    }}
                  />
                  {flag.label}
                </label>
              ))}
            </div>
          </div>
        ))
      )}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            className="w-full max-w-lg space-y-4 rounded-2xl border border-orange-200 bg-white p-6 dark:border-orange-500/20 dark:bg-zinc-950"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              setError(null);
              setMessage(null);
              startTransition(async () => {
                const res = await createUserByAdmin(fd);
                if (res.error) setError(res.error);
                else {
                  setShowCreate(false);
                  setMessage("Usuário criado. Pode entrar com email e senha.");
                  router.refresh();
                }
              });
            }}
          >
            <h2 className="text-lg font-semibold">Novo usuário</h2>
            <Input name="full_name" placeholder="Nome completo" required />
            <Input
              name="email"
              type="email"
              placeholder="email@empresa.com"
              required
            />
            <PasswordInput
              name="password"
              minLength={6}
              placeholder="Senha temporária (mín. 6)"
              required
              autoComplete="new-password"
            />
            <Input
              name="job_title"
              placeholder="Cargo (ex. Desenvolvedor)"
              defaultValue="Desenvolvedor"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {FLAGS.map((flag) => (
                <label
                  key={flag.key}
                  className="flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                >
                  <input
                    type="checkbox"
                    name={flag.key}
                    defaultChecked={
                      flag.key === "can_view_dashboard" ||
                      flag.key === "can_view_progresso"
                    }
                  />
                  {flag.label}
                </label>
              ))}
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Criando..." : "Criar usuário"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
