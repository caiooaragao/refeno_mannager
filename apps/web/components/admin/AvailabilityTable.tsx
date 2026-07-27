"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AvailabilitySlot,
  deleteDisponibilidade,
  getDisponibilidades,
} from "@/lib/api";
import { hasReadWritePermission } from "@/lib/permissions";
import { LOCATION_LABELS } from "@/lib/locations";
import { AvailabilityFormModal } from "@/components/admin/AvailabilityFormModal";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { TableRowActions } from "@/components/ui/TableRowActions";

interface AvailabilityTableProps {
  userPermission?: string | null;
}

const PAGE_SIZE = 10;

function splitDateTime(datetime: string) {
  const [date, time] = datetime.split(" ");
  return {
    date,
    time: time?.slice(0, 5) ?? datetime,
  };
}

export function AvailabilityTable({ userPermission = null }: AvailabilityTableProps) {
  const confirm = useConfirm();
  const canManage = hasReadWritePermission(userPermission);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const sortedSlots = useMemo(
    () =>
      [...slots].sort((a, b) =>
        a.horarioInicio.localeCompare(b.horarioInicio, "pt-BR")
      ),
    [slots]
  );

  const totalPages = Math.max(1, Math.ceil(sortedSlots.length / PAGE_SIZE));

  const paginatedSlots = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedSlots.slice(start, start + PAGE_SIZE);
  }, [sortedSlots, currentPage]);

  const pageStart =
    sortedSlots.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(currentPage * PAGE_SIZE, sortedSlots.length);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  async function loadSlots() {
    setLoading(true);
    setError(null);

    try {
      const data = await getDisponibilidades();
      setSlots(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar disponibilidades"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSlots();
  }, []);

  async function handleDelete(slot: AvailabilitySlot) {
    if (!canManage || !slot.disponivel) {
      return;
    }

    const start = splitDateTime(slot.horarioInicio);

    if (
      !(await confirm(
        `Tem certeza que deseja excluir a disponibilidade de ${start.date} às ${start.time}?`
      ))
    ) {
      return;
    }

    setDeletingId(slot.id);
    setError(null);

    try {
      await deleteDisponibilidade(slot.id);
      setSlots((current) => current.filter((item) => item.id !== slot.id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao excluir disponibilidade"
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSaved() {
    setShowCreateModal(false);
    setEditingSlot(null);
    loadSlots();
  }

  return (
    <>
      {(showCreateModal || editingSlot) && (
        <AvailabilityFormModal
          slot={editingSlot}
          canManage={canManage}
          onClose={() => {
            setShowCreateModal(false);
            setEditingSlot(null);
          }}
          onSaved={handleSaved}
        />
      )}

      <div className="forest-table-panel">
        <div className="forest-table-header">
          <div>
            <h2 className="text-sm font-semibold text-on-surface">Disponibilidades</h2>
            <p className="text-xs text-on-surface-variant">
              {sortedSlots.length} horário{sortedSlots.length === 1 ? "" : "s"} cadastrado
              {sortedSlots.length === 1 ? "" : "s"}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="forest-btn-primary w-full sm:w-auto"
            >
              Nova disponibilidade
            </button>
          )}
        </div>

        {error && (
          <div className="border-b border-outline-variant/50 bg-error-container/20 px-4 py-3 text-body-sm text-error">
            {error}
          </div>
        )}

        <div className="md:hidden">
          {loading ? (
            <p className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
              Carregando disponibilidades...
            </p>
          ) : sortedSlots.length === 0 ? (
            <p className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
              Nenhuma disponibilidade cadastrada.
            </p>
          ) : (
            <div className="forest-divider divide-y">
              {paginatedSlots.map((slot) => {
                const start = splitDateTime(slot.horarioInicio);
                const end = splitDateTime(slot.horarioFim);

                return (
                  <div key={slot.id} className="px-3 py-4 sm:px-4">
                    <p className="font-medium text-on-surface">
                      {LOCATION_LABELS[slot.local as keyof typeof LOCATION_LABELS] ??
                        slot.local}
                    </p>

                    <dl className="mt-2 space-y-1 text-sm text-on-surface-variant">
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-on-surface-variant">Data:</dt>
                        <dd>{start.date}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-on-surface-variant">Horário:</dt>
                        <dd>
                          {start.time} – {end.time}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-on-surface-variant">Status:</dt>
                        <dd
                          className={
                            slot.disponivel ? "text-primary" : "text-tertiary"
                          }
                        >
                          {slot.disponivel ? "Livre" : "Reservado"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <TableRowActions
                        onEdit={() => canManage && setEditingSlot(slot)}
                        onDelete={() => handleDelete(slot)}
                        disableEdit={!canManage || !slot.disponivel}
                        disableDelete={
                          !canManage || !slot.disponivel || deletingId === slot.id
                        }
                        deleting={deletingId === slot.id}
                        editAriaLabel="Editar disponibilidade"
                        deleteAriaLabel="Excluir disponibilidade"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="forest-table-thead">
              <tr>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Local</th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Data</th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Início</th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Fim</th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Status</th>
                <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                    Carregando disponibilidades...
                  </td>
                </tr>
              ) : sortedSlots.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-body-sm text-on-surface-variant">
                    Nenhuma disponibilidade cadastrada.
                  </td>
                </tr>
              ) : (
                paginatedSlots.map((slot, index) => {
                  const start = splitDateTime(slot.horarioInicio);
                  const end = splitDateTime(slot.horarioFim);

                  return (
                    <tr
                      key={slot.id}
                      className={`border-b border-outline-variant/50 transition-colors duration-150 hover:bg-primary/10 ${
                        index % 2 === 0 ? "forest-table-row-even" : "forest-table-row-odd"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface">
                        {LOCATION_LABELS[slot.local as keyof typeof LOCATION_LABELS] ??
                          slot.local}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                        {start.date}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                        {start.time}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                        {end.time}
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 ${
                          slot.disponivel ? "text-primary" : "text-tertiary"
                        }`}
                      >
                        {slot.disponivel ? "Livre" : "Reservado"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                        <div className="flex items-center gap-2">
                          <TableRowActions
                            onEdit={() => canManage && setEditingSlot(slot)}
                            onDelete={() => handleDelete(slot)}
                            disableEdit={!canManage || !slot.disponivel}
                            disableDelete={
                              !canManage || !slot.disponivel || deletingId === slot.id
                            }
                            deleting={deletingId === slot.id}
                            editAriaLabel="Editar disponibilidade"
                            deleteAriaLabel="Excluir disponibilidade"
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && sortedSlots.length > PAGE_SIZE && (
          <div className="flex flex-col gap-3 border-t border-outline-variant/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-on-surface-variant">
              Exibindo {pageStart}–{pageEnd} de {sortedSlots.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="forest-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Anterior
              </button>
              <span className="text-xs text-on-surface-variant">
                Página {currentPage} de {totalPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
                className="forest-btn-ghost px-3 py-1.5 text-xs disabled:opacity-40"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
