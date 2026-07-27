"use client";

import { useMemo, useState } from "react";
import { deleteInspection, Inscricao } from "@/lib/api";
import { downloadTableCsv, formatExcelText, splitDateTime } from "@/lib/csv";
import { hasReadWritePermission } from "@/lib/permissions";
import { LOCATION_LABELS } from "@/lib/locations";
import {
  getInspectionStatusColorClass,
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from "@/lib/inspection-status";
import { InspectionEditModal } from "@/components/admin/InspectionEditModal";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { SuccessDialog } from "@/components/ui/SuccessDialog";

type SortKey = keyof Pick<
  Inscricao,
  | "nome"
  | "nomeEmbarcacao"
  | "responsavelInspecao"
  | "celular"
  | "local"
  | "horarioInicio"
  | "horarioFim"
  | "status"
  | "observacoes"
>;

type SortDirection = "asc" | "desc";

interface DeletedInspection {
  nomeEmbarcacao: string;
  horarioInicio: string;
  horarioFim: string;
}

interface UpdatedInspection {
  nomeEmbarcacao: string;
  horarioInicio: string;
  horarioFim: string;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "nome", label: "Nome" },
  { key: "nomeEmbarcacao", label: "Nome da embarcação" },
  { key: "responsavelInspecao", label: "Responsável pela inspeção" },
  { key: "celular", label: "Telefone" },
  { key: "local", label: "Local" },
  { key: "horarioInicio", label: "data/hora inicio inspeção" },
  { key: "horarioFim", label: "data/hora fim inspeção" },
  { key: "status", label: "Status" },
  { key: "observacoes", label: "Observações" },
];

function compareValues(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function formatStatus(status: string): string {
  return (
    INSPECTION_STATUS_LABELS[status as InspectionStatus] ?? status
  );
}

function StatusLabel({ status }: { status: string }) {
  return (
    <span
      className={`font-medium ${getInspectionStatusColorClass(status)}`}
    >
      {formatStatus(status)}
    </span>
  );
}

const OBSERVACOES_PREVIEW_LENGTH = 20;

function formatObservacoesPreview(text: string): string {
  if (text.length <= OBSERVACOES_PREVIEW_LENGTH) return text;
  return `${text.slice(0, OBSERVACOES_PREVIEW_LENGTH)}...`;
}

function hasObservacoes(value: string | null): boolean {
  return Boolean(value?.trim());
}

interface ObservacoesPreviewProps {
  value: string | null;
  onView: (text: string) => void;
}

function ObservacoesPreview({ value, onView }: ObservacoesPreviewProps) {
  const text = value?.trim() ?? "";

  if (!hasObservacoes(value)) {
    return <span className="text-on-surface-variant">—</span>;
  }

  return (
    <button
      type="button"
      onClick={() => onView(text)}
      className="forest-btn-ghost inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded px-2 py-1 text-left text-sm text-on-surface-variant transition-colors hover:bg-secondary/10 hover:text-on-surface"
      aria-label={`Ver observação completa: ${text}`}
      title={text}
    >
      <span className="truncate">{formatObservacoesPreview(text)}</span>
      <svg
        className="h-4 w-4 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    </button>
  );
}

function formatTime(datetime: string): string {
  const timePart = datetime.split(" ")[1];
  return timePart ? timePart.slice(0, 5) : datetime;
}

interface InscricoesTableProps {
  inscricoes: Inscricao[];
  userPermission?: string | null;
  onDeleted?: (id: string) => void;
  onUpdated?: (inspection: Inscricao) => void;
}

export function InscricoesTable({
  inscricoes,
  userPermission = null,
  onDeleted,
  onUpdated,
}: InscricoesTableProps) {
  const confirm = useConfirm();
  const canReadWrite = hasReadWritePermission(userPermission);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("horarioInicio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedInspection, setDeletedInspection] =
    useState<DeletedInspection | null>(null);
  const [updatedInspection, setUpdatedInspection] =
    useState<UpdatedInspection | null>(null);
  const [editingInspection, setEditingInspection] = useState<Inscricao | null>(
    null
  );
  const [viewingObservacoes, setViewingObservacoes] = useState<string | null>(
    null
  );

  const columnCount = COLUMNS.length + 1;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = term
      ? inscricoes.filter((item) =>
          [
            item.nome,
            item.nomeEmbarcacao,
            item.responsavelInspecao,
            item.celular,
            item.local,
            item.horarioInicio,
            item.horarioFim,
            item.status,
            item.observacoes ?? "",
            item.createdAt,
          ].some((value) => value.toLowerCase().includes(term))
        )
      : inscricoes;

    return [...rows].sort((a, b) => {
      const aValue = a[sortKey] ?? "";
      const bValue = b[sortKey] ?? "";
      const result = compareValues(aValue, bValue);
      return sortDirection === "asc" ? result : -result;
    });
  }, [inscricoes, search, sortKey, sortDirection]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(key);
    setSortDirection("asc");
  }

  function handleDownloadCsv() {
    const date = new Date().toISOString().slice(0, 10);

    downloadTableCsv<Inscricao>(`inspecoes-${date}.csv`, [
      { label: "Nome", value: (row) => row.nome },
      { label: "Nome da embarcação", value: (row) => row.nomeEmbarcacao },
      {
        label: "Responsável pela inspeção",
        value: (row) => row.responsavelInspecao,
      },
      { label: "Telefone", value: (row) => row.celular },
      {
        label: "Local",
        value: (row) =>
          LOCATION_LABELS[row.local as keyof typeof LOCATION_LABELS] ?? row.local,
      },
      {
        label: "Data início inspeção",
        value: (row) => formatExcelText(splitDateTime(row.horarioInicio).date),
      },
      {
        label: "Hora início inspeção",
        value: (row) => formatExcelText(splitDateTime(row.horarioInicio).time),
      },
      {
        label: "Data fim inspeção",
        value: (row) => formatExcelText(splitDateTime(row.horarioFim).date),
      },
      {
        label: "Hora fim inspeção",
        value: (row) => formatExcelText(splitDateTime(row.horarioFim).time),
      },
      {
        label: "Status",
        value: (row) => formatStatus(row.status),
      },
      {
        label: "Observações",
        value: (row) => row.observacoes ?? "",
      },
    ], filtered);
  }

  async function handleDelete(item: Inscricao) {
    if (!canReadWrite) {
      return;
    }

    if (
      !(await confirm(
        `Tem certeza que deseja excluir a inspeção do barco ${item.nomeEmbarcacao}?`
      ))
    ) {
      return;
    }

    setDeleteError(null);
    setDeletingId(item.id);

    try {
      await deleteInspection(item.id);
      onDeleted?.(item.id);
      setDeletedInspection({
        nomeEmbarcacao: item.nomeEmbarcacao,
        horarioInicio: item.horarioInicio,
        horarioFim: item.horarioFim,
      });
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Erro ao excluir inspeção"
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleUpdated(inspection: Inscricao) {
    onUpdated?.(inspection);
    setEditingInspection(null);
    setUpdatedInspection({
      nomeEmbarcacao: inspection.nomeEmbarcacao,
      horarioInicio: inspection.horarioInicio,
      horarioFim: inspection.horarioFim,
    });
  }

  return (
    <>
      {editingInspection && canReadWrite && (
        <InspectionEditModal
          inspection={editingInspection}
          canUpdate={canReadWrite}
          onClose={() => setEditingInspection(null)}
          onUpdated={handleUpdated}
        />
      )}

      {updatedInspection && (
        <SuccessDialog
          title="Inspeção atualizada"
          ariaLabelledBy="update-success-title"
          onClose={() => setUpdatedInspection(null)}
        >
          Inspeção do barco{" "}
          <span className="font-semibold">
            {updatedInspection.nomeEmbarcacao}
          </span>{" "}
          de hora{" "}
          <span className="font-semibold">
            {formatTime(updatedInspection.horarioInicio)}
          </span>{" "}
          e{" "}
          <span className="font-semibold">
            {formatTime(updatedInspection.horarioFim)}
          </span>{" "}
          foi atualizada.
        </SuccessDialog>
      )}

      {deletedInspection && (
        <SuccessDialog
          title="Inspeção excluída"
          ariaLabelledBy="delete-success-title"
          onClose={() => setDeletedInspection(null)}
        >
          Inspeção do barco{" "}
          <span className="font-semibold">
            {deletedInspection.nomeEmbarcacao}
          </span>{" "}
          de hora{" "}
          <span className="font-semibold">
            {formatTime(deletedInspection.horarioInicio)}
          </span>{" "}
          e{" "}
          <span className="font-semibold">
            {formatTime(deletedInspection.horarioFim)}
          </span>{" "}
          foi excluída.
        </SuccessDialog>
      )}

      {viewingObservacoes !== null && (
        <div
          className="forest-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="observacoes-modal-title"
        >
          <div className="forest-modal max-w-lg">
            <h2
              id="observacoes-modal-title"
              className="text-headline-sm text-on-surface"
            >
              Observações
            </h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-body-sm leading-relaxed text-on-surface-variant">
              {viewingObservacoes}
            </p>
            <button
              type="button"
              onClick={() => setViewingObservacoes(null)}
              className="forest-btn-primary mt-6 px-6 py-2.5"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="forest-table-panel">
      <div className="forest-table-header">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">Inspeções</h2>
          <p className="text-xs text-on-surface-variant">
            {filtered.length} de {inscricoes.length} registro
            {inscricoes.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar inscrições..."
            className="forest-input w-full sm:max-w-xs"
          />

          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filtered.length === 0}
            className="forest-btn-secondary inline-flex cursor-pointer items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
            Gerar CSV
          </button>
        </div>
      </div>

      {deleteError && (
        <div className="border-b border-outline-variant/50 bg-error-container/20 px-3 py-3 text-body-sm text-error sm:px-4">
          {deleteError}
        </div>
      )}

      <div className="md:hidden">
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-on-surface-variant">
            Nenhuma inscrição encontrada.
          </p>
        ) : (
          <div className="forest-divider divide-y">
            {filtered.map((item) => (
              <div key={item.id} className="px-3 py-4 sm:px-4">
                <p className="font-medium text-on-surface">{item.nome}</p>
                <p className="mt-1 text-sm font-medium text-on-surface-variant">
                  {item.nomeEmbarcacao}
                </p>

                <dl className="mt-2 space-y-1 text-sm text-on-surface-variant">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Responsável:</dt>
                    <dd className="min-w-0">{item.responsavelInspecao}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Telefone:</dt>
                    <dd>{item.celular}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Local:</dt>
                    <dd>
                      {LOCATION_LABELS[item.local as keyof typeof LOCATION_LABELS] ??
                        item.local}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Início:</dt>
                    <dd>{item.horarioInicio}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Fim:</dt>
                    <dd>{item.horarioFim}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Status:</dt>
                    <dd>
                      <StatusLabel status={item.status} />
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-on-surface-variant">Observações:</dt>
                    <dd className="min-w-0">
                      <ObservacoesPreview
                        value={item.observacoes}
                        onView={setViewingObservacoes}
                      />
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex flex-col items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => canReadWrite && setEditingInspection(item)}
                    disabled={!canReadWrite}
                    aria-label={`Atualizar inspeção de ${item.nomeEmbarcacao}`}
                    className="forest-btn-ghost inline-flex w-full cursor-pointer items-center justify-center gap-1.5"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                    </svg>
                    <span>Atualizar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={!canReadWrite || deletingId === item.id}
                    aria-label={`Excluir inspeção de ${item.nomeEmbarcacao}`}
                    className="forest-btn-danger-ghost inline-flex w-full cursor-pointer items-center justify-center gap-1.5"
                  >
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                    <span>
                      {deletingId === item.id ? "Excluindo..." : "Excluir"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="forest-table-thead">
            <tr>
              {COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-outline-variant/50 px-4 py-3 font-medium"
                >
                  <button
                    type="button"
                    onClick={() => handleSort(column.key)}
                    className="inline-flex items-center gap-1 text-left hover:text-on-surface"
                  >
                    <span>{column.label}</span>
                    {sortKey === column.key && (
                      <span className="text-[10px] text-on-surface-variant">
                        {sortDirection === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                </th>
              ))}
              <th className="border-b border-outline-variant/50 px-4 py-3 font-medium">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={columnCount}
                  className="px-4 py-10 text-center text-sm text-on-surface-variant"
                >
                  Nenhuma inscrição encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((item, index) => (
                <tr
                  key={item.id}
                  className={`border-b border-outline-variant/50 transition-colors duration-150 hover:bg-primary/10 ${
                    index % 2 === 0 ? "forest-table-row-even" : "forest-table-row-odd"
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface">
                    {item.nome}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {item.nomeEmbarcacao}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {item.responsavelInspecao}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {item.celular}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {LOCATION_LABELS[item.local as keyof typeof LOCATION_LABELS] ??
                      item.local}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {item.horarioInicio}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-on-surface-variant">
                    {item.horarioFim}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <StatusLabel status={item.status} />
                  </td>
                  <td className="max-w-xs px-4 py-3.5 text-on-surface-variant">
                    <ObservacoesPreview
                      value={item.observacoes}
                      onView={setViewingObservacoes}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-on-surface-variant">
                    <div className="flex flex-col items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => canReadWrite && setEditingInspection(item)}
                        disabled={!canReadWrite}
                        aria-label={`Atualizar inspeção de ${item.nomeEmbarcacao}`}
                        title={
                          canReadWrite
                            ? "Atualizar inspeção"
                            : "Sem permissão para atualizar"
                        }
                        className="forest-btn-ghost inline-flex w-full cursor-pointer items-center justify-center gap-1.5 disabled:hover:bg-transparent"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                        </svg>
                        <span>Atualizar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        disabled={!canReadWrite || deletingId === item.id}
                        aria-label={`Excluir inspeção de ${item.nomeEmbarcacao}`}
                        title={
                          canReadWrite
                            ? "Excluir inspeção"
                            : "Sem permissão para excluir"
                        }
                        className="forest-btn-danger-ghost inline-flex w-full cursor-pointer items-center justify-center gap-1.5 disabled:hover:bg-transparent"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M3 6h18" />
                          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                        </svg>
                        <span>
                          {deletingId === item.id ? "Excluindo..." : "Excluir"}
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
