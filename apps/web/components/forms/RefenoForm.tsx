"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import {
  createInspection,
  getAvailableDates,
  getAvailableSlots,
  TimeSlot,
} from "@/lib/api";
import { InspectionSuccess } from "@/components/forms/InspectionSuccess";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { FormSelect } from "@/components/ui/FormSelect";
import { PhoneField } from "@/components/ui/PhoneField";
import {
  INSPECTION_LOCATIONS,
  LOCATION_LABELS,
  type InspectionLocation,
} from "@/lib/locations";

interface SuccessData {
  nomeEmbarcacao: string;
  horarioInicio: string;
  horarioFim: string;
}

interface FormData {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  celular: string;
  local: InspectionLocation | "";
  dataInspecao: string;
  horarioSlot: string;
}

const initialForm: FormData = {
  nome: "",
  nomeEmbarcacao: "",
  responsavelInspecao: "",
  celular: "",
  local: "",
  dataInspecao: "",
  horarioSlot: "",
};

function formatSlotLabel(inicio: string, fim: string): string {
  const startHour = inicio.split(" ")[1].slice(0, 5);
  const endHour = fim.split(" ")[1].slice(0, 5);
  return `${startHour} às ${endHour}`;
}

function getSlotTime(inicio: string): string {
  return inicio.split(" ")[1].slice(0, 5);
}

function validateForm(data: FormData): string | null {
  if (!data.nome.trim()) return "Nome é obrigatório";
  if (!data.nomeEmbarcacao.trim()) return "Nome da embarcação é obrigatório";
  if (!data.responsavelInspecao.trim())
    return "Responsável pela inspeção é obrigatório";
  if (!data.celular.trim()) return "Celular do responsável pela inspeção é obrigatório";
  if (!data.local) return "Local é obrigatório";
  if (!data.dataInspecao) return "Data da inspeção é obrigatória";
  if (!data.horarioSlot) return "Horário é obrigatório";

  return null;
}

export function RefenoForm() {
  const confirm = useConfirm();
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [successData, setSuccessData] = useState<SuccessData | null>(null);
  const [formExiting, setFormExiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datesError, setDatesError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const formTopRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef(false);

  useEffect(() => {
    if (!error || !pendingScrollRef.current) {
      return;
    }

    pendingScrollRef.current = false;

    requestAnimationFrame(() => {
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [error]);

  function showFormError(message: string) {
    pendingScrollRef.current = true;
    setError(message);
  }

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
          setForm((prev) => {
            if (prev.dataInspecao && !response.datas.includes(prev.dataInspecao)) {
              return { ...prev, dataInspecao: "", horarioSlot: "" };
            }
            return prev;
          });
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
          setForm((prev) => {
            if (
              prev.horarioSlot &&
              !daySlots.horarios.some(
                (slot) =>
                  slot.disponivel && getSlotTime(slot.inicio) === prev.horarioSlot
              )
            ) {
              return { ...prev, horarioSlot: "" };
            }
            return prev;
          });
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

  function handleChange(field: keyof FormData, value: string) {
    if (field === "local") {
      setAvailableDates([]);
      setAvailableSlots([]);
      setForm((prev) => ({
        ...prev,
        local: value as InspectionLocation | "",
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

    const validationError = validateForm(form);
    if (validationError) {
      showFormError(validationError);
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.disponivel && getSlotTime(slot.inicio) === form.horarioSlot
    );

    if (!selectedSlot) {
      showFormError("Selecione um horário disponível");
      return;
    }

    if (!(await confirm("Tem certeza que deseja confirmar o cadastro da inspeção?"))) {
      return;
    }

    setLoading(true);

    try {
      await createInspection({
        nome: form.nome,
        nomeEmbarcacao: form.nomeEmbarcacao,
        responsavelInspecao: form.responsavelInspecao,
        celular: form.celular,
        local: form.local,
        dataInspecao: form.dataInspecao,
        horario: selectedSlot.inicio.split(" ")[1],
      });

      const registered = {
        nomeEmbarcacao: form.nomeEmbarcacao,
        horarioInicio: selectedSlot.inicio,
        horarioFim: selectedSlot.fim,
      };

      setFormExiting(true);

      setTimeout(() => {
        setSuccessData(registered);
        setForm(initialForm);
        setAvailableDates([]);
        setAvailableSlots([]);
        setFormExiting(false);
      }, 350);
    } catch (err) {
      showFormError(
        err instanceof Error ? err.message : "Erro ao enviar formulário"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNewInspection() {
    setSuccessData(null);
    setError(null);
    setDatesError(null);
    setSlotsError(null);
  }

  return (
    <div className="forest-card mx-auto w-full max-w-xl p-4 sm:p-6">
      <div ref={formTopRef} className="scroll-mt-24" aria-hidden />
      {successData ? (
        <InspectionSuccess
          nomeEmbarcacao={successData.nomeEmbarcacao}
          horarioInicio={successData.horarioInicio}
          horarioFim={successData.horarioFim}
          onNewInspection={handleNewInspection}
        />
      ) : (
        <div className={formExiting ? "animate-fade-out-up" : ""}>
          <div className="mb-4 text-center">
            <h1 className="forest-form-title">
            Formulário de Inspeção - Refeno 2026
            </h1>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Cadastro de inspeção de embarcação
            </p>
          </div>

          {error && <Alert type="error" message={error} />}

          <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
          >
            <FormField
              id="nome"
              label="Nome do comandante"
              type="text"
              value={form.nome}
              onChange={(e) => handleChange("nome", e.target.value)}
              placeholder="Nome completo do comandante"
              disabled={loading}
            />

            <FormField
              id="nomeEmbarcacao"
              label="Nome da embarcação"
              type="text"
              value={form.nomeEmbarcacao}
              onChange={(e) => handleChange("nomeEmbarcacao", e.target.value)}
              placeholder="Nome da embarcação"
              disabled={loading}
            />

            <FormField
              id="responsavelInspecao"
              label="Responsável pela inspeção"
              type="text"
              value={form.responsavelInspecao}
              onChange={(e) => handleChange("responsavelInspecao", e.target.value)}
              placeholder="Nome do responsável pela inspeção"
              disabled={loading}
            />

            <PhoneField
              id="celular"
              label="Celular do responsável pela inspeção"
              value={form.celular}
              onChange={(value) => handleChange("celular", value)}
              placeholder="(81) 99999-9999"
              disabled={loading}
            />

            <FormSelect
              id="local"
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

            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FormSelect
                  id="dataInspecao"
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
                  {availableDates.map((date) => (
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
                  id="horarioSlot"
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

                    return (
                      <option
                        key={slot.inicio}
                        value={time}
                        disabled={!slot.disponivel}
                      >
                        {formatSlotLabel(slot.inicio, slot.fim)}
                        {!slot.disponivel ? " (indisponível)" : ""}
                      </option>
                    );
                  })}
                </FormSelect>
                {slotsError && (
                  <p className="mt-1 text-xs text-error">{slotsError}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || loadingDates || loadingSlots}
              className="forest-btn-primary mt-1 w-full text-sm sm:w-auto"
            >
              {loading ? "Enviando..." : "Cadastrar inspeção"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
