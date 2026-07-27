"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AvailabilitySlot,
  createDisponibilidade,
  updateDisponibilidade,
} from "@/lib/api";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { FormSelect } from "@/components/ui/FormSelect";
import {
  INSPECTION_LOCATIONS,
  LOCATION_LABELS,
  type InspectionLocation,
} from "@/lib/locations";
import { getEndTimeOptions, getTimeOptions } from "@/lib/time";

interface TimeRange {
  inicio: string;
  fim: string;
}

interface AvailabilityFormModalProps {
  slot?: AvailabilitySlot | null;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function splitDateTime(datetime: string) {
  const [date, time] = datetime.split(" ");
  return {
    date,
    time: time?.slice(0, 5) ?? "",
  };
}

function toIsoDate(apiDate: string): string {
  const [day, month, year] = apiDate.split("/");
  return `${year}-${month}-${day}`;
}

function fromIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function validateTimeRange(range: TimeRange): string | null {
  if (!range.inicio || !range.fim) {
    return "Informe início e fim do horário";
  }

  if (range.fim <= range.inicio) {
    return "Horário de fim deve ser posterior ao início";
  }

  return null;
}

function validateDateRange(dataInicio: string, dataFim: string): string | null {
  if (!dataInicio || !dataFim) {
    return "Informe a data inicial e a data final";
  }

  const start = toIsoDate(dataInicio);
  const end = toIsoDate(dataFim);

  if (end < start) {
    return "Data final deve ser igual ou posterior à data inicial";
  }

  return null;
}

export function AvailabilityFormModal({
  slot,
  canManage,
  onClose,
  onSaved,
}: AvailabilityFormModalProps) {
  const confirm = useConfirm();
  const isEditing = Boolean(slot);
  const initialDate = slot ? splitDateTime(slot.horarioInicio).date : "";
  const initialStart = slot ? splitDateTime(slot.horarioInicio).time : "";
  const initialEnd = slot ? splitDateTime(slot.horarioFim).time : "";

  const [local, setLocal] = useState<InspectionLocation | "">(
    (slot?.local as InspectionLocation) ?? ""
  );
  const [dataInicio, setDataInicio] = useState(initialDate);
  const [dataFim, setDataFim] = useState(initialDate);
  const [horarios, setHorarios] = useState<TimeRange[]>([
    { inicio: initialStart, fim: initialEnd },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slot) {
      return;
    }

    const start = splitDateTime(slot.horarioInicio);
    const end = splitDateTime(slot.horarioFim);

    setLocal(slot.local as InspectionLocation);
    setDataInicio(start.date);
    setDataFim(start.date);
    setHorarios([{ inicio: start.time, fim: end.time }]);
  }, [slot]);

  function handleHorarioChange(
    index: number,
    field: keyof TimeRange,
    value: string
  ) {
    setHorarios((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        if (field === "inicio") {
          const next = { ...item, inicio: value };
          if (next.fim && next.fim <= value) {
            next.fim = "";
          }
          return next;
        }

        return { ...item, [field]: value };
      })
    );
  }

  function addHorario() {
    setHorarios((current) => [...current, { inicio: "", fim: "" }]);
  }

  function removeHorario(index: number) {
    setHorarios((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canManage) {
      setError("Usuário não tem permissão para gerenciar disponibilidades");
      return;
    }

    if (!local) {
      setError("Local é obrigatório");
      return;
    }

    const dateValidationError = isEditing
      ? dataInicio
        ? null
        : "Data é obrigatória"
      : validateDateRange(dataInicio, dataFim);

    if (dateValidationError) {
      setError(dateValidationError);
      return;
    }

    for (const horario of horarios) {
      const validationError = validateTimeRange(horario);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    if (
      !isEditing &&
      !(await confirm(
        "Tem certeza que deseja confirmar o cadastro da disponibilidade?"
      ))
    ) {
      return;
    }

    setLoading(true);

    try {
      if (isEditing && slot) {
        const horario = horarios[0];
        await updateDisponibilidade(slot.id, {
          local,
          dataInspecao: dataInicio,
          inicio: horario.inicio,
          fim: horario.fim,
        });
      } else {
        await createDisponibilidade({
          local,
          dataInicio,
          dataFim,
          horarios,
        });
      }

      onSaved();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar disponibilidade"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="forest-modal-overlay py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="availability-form-title"
    >
      <div className="forest-modal max-h-[90vh] max-w-xl overflow-y-auto">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2
              id="availability-form-title"
              className="text-headline-sm text-on-surface"
            >
              {isEditing ? "Editar disponibilidade" : "Nova disponibilidade"}
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {isEditing
                ? "Edite a data e os horários desta disponibilidade"
                : "Cadastre um intervalo de datas e horários por local"}
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
          <FormSelect
            id="availability-local"
            label="Local"
            value={local}
            onChange={(e) => setLocal(e.target.value as InspectionLocation)}
            disabled={loading}
          >
            <option value="">Selecione o local</option>
            {INSPECTION_LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {LOCATION_LABELS[location]}
              </option>
            ))}
          </FormSelect>

          {isEditing ? (
            <FormField
              id="availability-date"
              label="Data"
              type="date"
              value={dataInicio ? toIsoDate(dataInicio) : ""}
              onChange={(e) => setDataInicio(fromIsoDate(e.target.value))}
              disabled={loading}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                id="availability-date-start"
                label="Data inicial"
                type="date"
                value={dataInicio ? toIsoDate(dataInicio) : ""}
                onChange={(e) => setDataInicio(fromIsoDate(e.target.value))}
                disabled={loading}
              />

              <FormField
                id="availability-date-end"
                label="Data final"
                type="date"
                value={dataFim ? toIsoDate(dataFim) : ""}
                onChange={(e) => setDataFim(fromIsoDate(e.target.value))}
                disabled={loading}
                min={dataInicio ? toIsoDate(dataInicio) : undefined}
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-body-sm font-medium text-on-surface-variant">Horários</p>
              {!isEditing && (
                <button
                  type="button"
                  onClick={addHorario}
                  disabled={loading}
                  className="text-body-sm font-semibold text-secondary hover:text-primary disabled:opacity-50"
                >
                  + Adicionar horário
                </button>
              )}
            </div>

            {!isEditing && dataInicio && dataFim && (
              <p className="text-xs text-on-surface-variant">
                Os horários abaixo serão criados para cada dia entre{" "}
                <span className="font-medium text-on-surface">{dataInicio}</span> e{" "}
                <span className="font-medium text-on-surface">{dataFim}</span>, em
                intervalos de 30 minutos.
              </p>
            )}

            {horarios.map((horario, index) => (
              <div
                key={`${index}-${horario.inicio}-${horario.fim}`}
                className="grid grid-cols-1 gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <FormSelect
                  id={`availability-start-${index}`}
                  label="Início"
                  value={horario.inicio}
                  onChange={(e) =>
                    handleHorarioChange(index, "inicio", e.target.value)
                  }
                  disabled={loading}
                >
                  <option value="">Selecione</option>
                  {getTimeOptions(horario.inicio).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </FormSelect>

                <FormSelect
                  id={`availability-end-${index}`}
                  label="Fim"
                  value={horario.fim}
                  onChange={(e) =>
                    handleHorarioChange(index, "fim", e.target.value)
                  }
                  disabled={loading || !horario.inicio}
                >
                  <option value="">
                    {horario.inicio ? "Selecione" : "Selecione o início primeiro"}
                  </option>
                  {getEndTimeOptions(horario.inicio, horario.fim).map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </FormSelect>

                {!isEditing && horarios.length > 1 && (
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeHorario(index)}
                      disabled={loading}
                      className="forest-btn-danger-ghost px-3 py-2"
                    >
                      Remover
                    </button>
                  </div>
                )}
              </div>
            ))}
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
              disabled={loading}
              className="forest-btn-primary px-5 py-2.5"
            >
              {loading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
