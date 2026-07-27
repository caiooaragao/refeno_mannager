"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityTable } from "@/components/admin/AvailabilityTable";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { InscricoesTable } from "@/components/admin/InscricoesTable";
import { UsersTable } from "@/components/admin/UsersTable";
import {
  AuthUser,
  AvailabilitySlot,
  getDisponibilidades,
  getInscricoes,
  getMe,
  logoutAdmin,
  Inscricao,
} from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { logout, setAuthenticated } from "@/lib/auth";

export function AdminDashboard() {
  const router = useRouter();
  const confirm = useConfirm();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [inscricoes, setInscricoes] = useState<Inscricao[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);

      try {
        const [currentUser, data, disponibilidades] = await Promise.all([
          getMe(),
          getInscricoes(),
          getDisponibilidades().catch(() => [] as AvailabilitySlot[]),
        ]);

        if (!cancelled) {
          setUser(currentUser);
          setInscricoes(Array.isArray(data) ? data : []);
          setSlots(Array.isArray(disponibilidades) ? disponibilidades : []);
          setAuthenticated(true);
        }
      } catch (err) {
        if (!cancelled) {
          logout();
          router.replace("/admin");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    if (!(await confirm("Tem certeza que deseja sair?"))) {
      return;
    }

    setLoggingOut(true);

    try {
      await logoutAdmin();
    } catch {
      // Mesmo com falha na API, encerra a sessão local.
    } finally {
      logout();
      setAuthenticated(false);
      router.replace("/admin");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-body-sm text-on-surface-variant">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline-sm text-on-surface sm:text-headline-md">Dashboard</h1>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Logado como <span className="font-medium text-on-surface">{user?.login}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="forest-btn-danger w-full sm:w-auto"
        >
          {loggingOut ? "Saindo..." : "Sair"}
        </button>
      </div>

      <DashboardStats inscricoes={inscricoes} slots={slots} />

      <InscricoesTable
        inscricoes={inscricoes}
        userPermission={user?.permission}
        onDeleted={(id) =>
          setInscricoes((current) => current.filter((item) => item.id !== id))
        }
        onUpdated={(inspection) =>
          setInscricoes((current) =>
            current.map((item) => (item.id === inspection.id ? inspection : item))
          )
        }
      />

      <UsersTable userPermission={user?.permission} currentUserId={user?.id} />

      <AvailabilityTable userPermission={user?.permission} />

      
    </div>
  );
}
