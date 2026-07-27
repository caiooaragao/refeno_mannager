"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getAvailableDates,
  getAvailableSlots,
  Inscricao,
  TimeSlot,
  updateInspection,
} from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { FormField } from "@/components/ui/FormField";
import { FormSelect } from "@/components/ui/FormSelect";
import { PhoneField } from "@/components/ui/PhoneField";
import {
  INSPECTION_STATUSES,
  INSPECTION_STATUS_LABELS,
  type InspectionStatus,
} from "@/lib/inspection-status";
import {
  INSPECTION_LOCATIONS,
  LOCATION_LABELS,
  type InspectionLocation,
} from "@/lib/locations";

interface FormData {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  celular: string;
  local: InspectionLocation | "";
  dataInspecao: string;
  horarioSlot: string;
  observacoes: string;
  status: InspectionStatus;
}

interface InspectionEditModalProps {
  inspection: Inscricao;
  canUpdate: boolean;
  onClose: () => void;
  onUpdated: (inspection: Inscricao) => void;
}

function formatSlotLabel(inicio: string, fim: string): string {
  const startHour = inicio.split(" ")[1].slice(0, 5);
  const endHour = fim.split(" ")[1].slice(0, 5);
  return `${startHour} às ${endHour}`;
}

function getSlotTime(inicio: string): string {
  return inicio.split(" ")[1].slice(0, 5);
}

function buildFormData(inspection: Inscricao): FormData {
  const [datePart, timePart] = inspection.horarioInicio.split(" ");

  return {
    nome: inspection.nome,
    nomeEmbarcacao: inspection.nomeEmbarcacao,
    responsavelInspecao: inspection.responsavelInspecao,
    celular: inspection.celular,
    local: inspection.local as InspectionLocation,
    dataInspecao: datePart,
    horarioSlot: timePart?.slice(0, 5) ?? "",
    observacoes: inspection.observacoes ?? "",
    status: (inspection.status as InspectionStatus) ?? "pendente",
  };
}

function validateForm(data: FormData): string | null {
  if (!data.nome.trim()) return "Nome é obrigatório";
  if (!data.nomeEmbarcacao.trim()) return "Nome da embarcação é obrigatório";
  if (!data.responsavelInspecao.trim()) {
    return "Responsável pela inspeção é obrigatório";
  }
  if (!data.celular.trim()) {
    return "Celular do responsável pela inspeção é obrigatório";
  }
  if (!data.local) return "Local é obrigatório";
  if (!data.dataInspecao) return "Data da inspeção é obrigatória";
  if (!data.horarioSlot) return "Horário é obrigatório";

  return null;
}

export function InspectionEditModal({
  inspection,
  canUpdate,
  onClose,
  onUpdated,
}: InspectionEditModalProps) {
  const confirm = useConfirm();
  const [form, setForm] = useState<FormData>(() => buildFormData(inspection));
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const currentInspectionDate = useMemo(
    () => inspection.horarioInicio.split(" ")[0],
    [inspection.horarioInicio]
  );

  const dateOptions = useMemo(() => {
    const dates = new Set(availableDates);
    dates.add(currentInspectionDate);
    return Array.from(dates).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [availableDates, currentInspectionDate]);

  useEffect(() => {
    if (!form.local) {
      setAvailableDates([]);
      setLoadingDates(false);
      setDatesError(null);
      return;
    }

    let cancelled = false;

    async function loadDates() {
      setLoadingDates(true);
      setDatesError(null);

      try {
        const response = await getAvailableDates({ local: form.local });

        if (!cancelled) {
          setAvailableDates(response.datas);
        }
      } catch (err) {
        if (!cancelled) {
          setAvailableDates([]);
          setDatesError(
            err instanceof Error
              ? err.message
              : "Erro ao buscar datas disponíveis"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingDates(false);
        }
      }
    }

    loadDates();

    return () => {
      cancelled = true;
    };
  }, [form.local]);

  useEffect(() => {
    if (!form.local || !form.dataInspecao) {
      setAvailableSlots([]);
      setLoadingSlots(false);
      setSlotsError(null);
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotsError(null);

      try {
        const daySlots = await getAvailableSlots({
          local: form.local,
          dataInspecao: form.dataInspecao,
        });

        if (!cancelled) {
          setAvailableSlots(daySlots.horarios);
        }
      } catch (err) {
        if (!cancelled) {
          setAvailableSlots([]);
          setSlotsError(
            err instanceof Error
              ? err.message
              : "Erro ao buscar horários disponíveis"
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingSlots(false);
        }
      }
    }

    loadSlots();

    return () => {
      cancelled = true;
    };
  }, [form.local, form.dataInspecao]);

  function isSlotSelectable(slot: TimeSlot): boolean {
    if (slot.disponivel) {
      return true;
    }

    return slot.inicio === inspection.horarioInicio;
  }

  function handleChange(field: keyof FormData, value: string) {
    if (field === "local") {
      setAvailableDates([]);
      setAvailableSlots([]);
      setForm((prev) => ({
        ...prev,
        local: value as InspectionLocation,
        dataInspecao: "",
        horarioSlot: "",
      }));
    } else if (field === "dataInspecao") {
      setAvailableSlots([]);
      setForm((prev) => ({
        ...prev,
        dataInspecao: value,
        horarioSlot: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }

    setError(null);
    setDatesError(null);
    setSlotsError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canUpdate) {
      setError("Usuário não tem permissão para atualizar inspeções");
      return;
    }

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) =>
        isSlotSelectable(slot) && getSlotTime(slot.inicio) === form.horarioSlot
    );

    if (!selectedSlot) {
      setError("Selecione um horário disponível");
      return;
    }

    if (
      !(await confirm(
        "Tem certeza que deseja confirmar a atualização da inspeção?"
      ))
    ) {
      return;
    }

    setLoading(true);

    try {
      const updated = await updateInspection(inspection.id, {
        nome: form.nome,
        nomeEmbarcacao: form.nomeEmbarcacao,
        responsavelInspecao: form.responsavelInspecao,
        celular: form.celular,
        local: form.local,
        dataInspecao: form.dataInspecao,
        horario: selectedSlot.inicio.split(" ")[1],
        observacoes: form.observacoes.trim() || null,
        status: form.status,
      });

      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar inspeção");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="forest-modal-overlay py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-inspection-title"
    >
      <div className="forest-modal max-h-[90vh] max-w-xl overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="edit-inspection-title" className="text-headline-sm text-on-surface">
              Atualizar inspeção
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Edite os dados da inspeção selecionada
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Fechar modal"
            className="rounded px-2 py-1 text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {error && <Alert type="error" message={error} />}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <FormField
            id="edit-nome"
            label="Nome do comandante"
            type="text"
            placeholder="Nome do comandante"
            value={form.nome}
            onChange={(e) => handleChange("nome", e.target.value)}
            disabled={loading}
          />

          <FormField
            id="edit-nomeEmbarcacao"
            label="Nome da embarcação"
            placeholder="Nome da embarcação"
            type="text"
            value={form.nomeEmbarcacao}
            onChange={(e) => handleChange("nomeEmbarcacao", e.target.value)}
            disabled={loading}
          />

          <FormField
            id="edit-responsavelInspecao"
            label="Responsável pela inspeção"
            placeholder="Nome do responsável pela inspeção"
            type="text"
            value={form.responsavelInspecao}
            onChange={(e) => handleChange("responsavelInspecao", e.target.value)}
            disabled={loading}
          />

          <PhoneField
            id="edit-celular"
            label="Celular do responsável pela inspeção"
            value={form.celular}
            onChange={(value) => handleChange("celular", value)}
            placeholder="(81) 99999-9999"
            disabled={loading}
          />

          <FormSelect
            id="edit-local"
            label="Local da inspeção"
            value={form.local}
            onChange={(e) => handleChange("local", e.target.value)}
            disabled={loading}
          >
            <option value="">Selecione o local</option>
            {INSPECTION_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {LOCATION_LABELS[location]}
              </option>
            ))}
          </FormSelect>

          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FormSelect
                id="edit-dataInspecao"
                label="Data da inspeção"
                value={form.dataInspecao}
                onChange={(e) => handleChange("dataInspecao", e.target.value)}
                disabled={loading || !form.local || loadingDates}
              >
                <option value="">
                  {!form.local
                    ? "Selecione o local primeiro"
                    : loadingDates
                      ? "Carregando datas..."
                      : "Selecione uma data"}
                </option>
                {dateOptions.map((date) => (
                  <option key={date} value={date}>
                    {date}
                  </option>
                ))}
              </FormSelect>
              {datesError && (
                <p className="mt-1 text-xs text-error">{datesError}</p>
              )}
            </div>

            <div>
              <FormSelect
                id="edit-horarioSlot"
                label="Horário"
                value={form.horarioSlot}
                onChange={(e) => handleChange("horarioSlot", e.target.value)}
                disabled={loading || !form.dataInspecao || loadingSlots}
              >
                <option value="">
                  {!form.dataInspecao
                    ? "Selecione a data primeiro"
                    : loadingSlots
                      ? "Carregando horários..."
                      : "Selecione um horário"}
                </option>
                {availableSlots.map((slot) => {
                  const time = getSlotTime(slot.inicio);
                  const selectable = isSlotSelectable(slot);

                  return (
                    <option
                      key={slot.inicio}
                      value={time}
                      disabled={!selectable}
                    >
                      {formatSlotLabel(slot.inicio, slot.fim)}
                      {!selectable ? " (indisponível)" : ""}
                    </option>
                  );
                })}
              </FormSelect>
              {slotsError && (
                <p className="mt-1 text-xs text-error">{slotsError}</p>
              )}
            </div>
          </div>

          <FormSelect
            id="edit-status"
            label="Status"
            value={form.status}
            onChange={(e) => handleChange("status", e.target.value)}
            disabled={loading}
          >
            {INSPECTION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {INSPECTION_STATUS_LABELS[status]}
              </option>
            ))}
          </FormSelect>

          <div className="flex min-w-0 flex-col gap-1">
            <label htmlFor="edit-observacoes" className="forest-label">
              Observações
            </label>
            <textarea
              id="edit-observacoes"
              value={form.observacoes}
              onChange={(e) => handleChange("observacoes", e.target.value)}
              disabled={loading}
              rows={4}
              maxLength={2000}
              className="forest-input resize-y"
              placeholder="Observações internas sobre a inspeção"
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="forest-btn-secondary px-5 py-2.5"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || loadingDates || loadingSlots}
              className="forest-btn-primary px-5 py-2.5"
            >
              {loading ? "Atualizando..." : "Atualizar inspeção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
