import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth";
import { formatDateLong } from "@/lib/utils";
import { User } from "lucide-react";

export default async function PerfilPage() {
  const session = await requireUser();
  const { profile } = session;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8 flex items-center gap-2 text-zinc-900 dark:text-white">
        <User className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Meu Perfil</h1>
      </div>

      <ProfileForm profile={profile} />

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">Informações da Conta</h2>
        <div className="mt-4 space-y-2 text-sm text-zinc-500">
          <p>Conta criada em: {formatDateLong(profile.created_at)}</p>
          <p>Última atualização: {formatDateLong(profile.updated_at)}</p>
        </div>
      </div>
    </div>
  );
}
