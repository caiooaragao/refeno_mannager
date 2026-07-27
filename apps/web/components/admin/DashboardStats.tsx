"use client";

import { useMemo } from "react";
import { AvailabilitySlot, Inscricao } from "@/lib/api";

interface DashboardStatsProps {
  inscricoes?: Inscricao[] | null;
  slots?: AvailabilitySlot[] | null;
}

function extractDate(datetime: string | null | undefined): string | null {
  if (!datetime) {
    return null;
  }

  const [date] = datetime.split(" ");

  return date || null;
}

function countAvailableDays(
  slots: AvailabilitySlot[],
  local: string
): number {
  const dates = new Set<string>();

  for (const slot of slots) {
    if (!slot || slot.local !== local || slot.disponivel !== true) {
      continue;
    }

    const date = extractDate(slot.horarioInicio);

    if (date) {
      dates.add(date);
    }
  }

  return dates.size;
}

function countReservedSlots(slots: AvailabilitySlot[]): number {
  return slots.filter((slot) => slot && slot.disponivel === false).length;
}

interface StatCardProps {
  label: string;
  value: number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <article className="forest-card p-4 sm:p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-on-surface">
        {value}
      </p>
    </article>
  );
}

export function DashboardStats({
  inscricoes = [],
  slots = [],
}: DashboardStatsProps) {
  const stats = useMemo(() => {
    const safeInscricoes = Array.isArray(inscricoes) ? inscricoes : [];
    const safeSlots = Array.isArray(slots) ? slots : [];

    return {
      totalInscricoes: safeInscricoes.length,
      diasCabanga: countAvailableDays(safeSlots, "cabanga"),
      diasRecifeMarina: countAvailableDays(safeSlots, "recife_marina"),
      horariosReservados: countReservedSlots(safeSlots),
    };
  }, [inscricoes, slots]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Total de inspeções inscritas"
        value={stats.totalInscricoes}
      />
      <StatCard
        label="Dias disponíveis Cabanga"
        value={stats.diasCabanga}
      />
      <StatCard
        label="Dias disponíveis Recife Marina"
        value={stats.diasRecifeMarina}
      />
      <StatCard
        label="Total de horários reservados"
        value={stats.horariosReservados}
      />
    </div>
  );
}
