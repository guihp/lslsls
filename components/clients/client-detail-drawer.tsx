"use client";

import { getClientDetail } from "@/app/actions/clients";
import { ClientDetailView } from "@/components/clients/client-detail-view";
import { ClientDrawer } from "@/components/clients/client-drawer";
import type { ClientDetailData } from "@/lib/clients/load-client-detail";
import { useEffect, useState, useTransition } from "react";

export function ClientDetailDrawer({
  clientId,
  onClose,
  canCreate,
  currentUserId,
}: {
  clientId: string;
  onClose: () => void;
  canCreate: boolean;
  currentUserId: string;
}) {
  const [data, setData] = useState<ClientDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      const res = await getClientDetail(clientId);
      if (cancelled) return;
      if ("error" in res) {
        setError(res.error);
        setData(null);
      } else {
        setData(res.data);
        setError(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [clientId, reloadToken]);

  return (
    <ClientDrawer onClose={onClose}>
      {error ? (
        <div className="p-6 text-sm text-red-500">{error}</div>
      ) : pending && !data ? (
        <div className="p-6 text-sm text-zinc-500">Carregando…</div>
      ) : data ? (
        <ClientDetailView
          client={data.client}
          sprints={data.sprints}
          tasks={data.tasks}
          comments={data.comments}
          activity={data.activity}
          attachments={data.attachments}
          profiles={data.profiles}
          canCreate={canCreate}
          currentUserId={currentUserId}
          onRefresh={() => setReloadToken((token) => token + 1)}
          compact
        />
      ) : null}
    </ClientDrawer>
  );
}
