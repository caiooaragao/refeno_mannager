"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createInspection, getAvailableSlots, TimeSlot } from "@/lib/api";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { FormSelect } from "@/components/ui/FormSelect";

interface FormData {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  dataInspecao: string;
  horarioSlot: string;
}

const initialForm: FormData = {
  nome: "",
  nomeEmbarcacao: "",
  responsavelInspecao: "",
  dataInspecao: "",
  horarioSlot: "",
};

function toApiDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function formatSlotLabel(inicio: string, fim: string): string {
  const startHour = inicio.split(" ")[1].slice(0, 5);
  const endHour = fim.split(" ")[1].slice(0, 5);
  return `${startHour} às ${endHour}`;
}

function getSlotHour(inicio: string): string {
  return inicio.split(" ")[1].slice(0, 2);
}

function validateForm(data: FormData): string | null {
  if (!data.nome.trim()) return "Nome é obrigatório";
  if (!data.nomeEmbarcacao.trim()) return "Nome da embarcação é obrigatório";
  if (!data.responsavelInspecao.trim())
    return "Responsável pela inspeção é obrigatório";
  if (!data.dataInspecao) return "Data da inspeção é obrigatória";
  if (!data.horarioSlot) return "Horário é obrigatório";

  return null;
}

export function RefenoForm() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

  const today = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  useEffect(() => {
    if (!form.dataInspecao) {
      setAvailableSlots([]);
      setLoadingSlots(false);
      setSlotsError(null);
      return;
    }

    let cancelled = false;

    async function loadSlots() {
      setLoadingSlots(true);
      setSlotsError(null);
      setAvailableSlots([]);

      try {
        const daySlots = await getAvailableSlots({
          dataInspecao: toApiDate(form.dataInspecao),
        });

        if (!cancelled) {
          setAvailableSlots(daySlots.horarios);
          setForm((prev) => {
            if (
              prev.horarioSlot &&
              !daySlots.horarios.some(
                (slot) =>
                  slot.disponivel && getSlotHour(slot.inicio) === prev.horarioSlot
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
  }, [form.dataInspecao]);

  function handleChange(field: keyof FormData, value: string) {
    if (field === "dataInspecao") {
      setForm((prev) => ({
        ...prev,
        dataInspecao: value,
        horarioSlot: "",
      }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }

    setSuccess(null);
    setError(null);
    setSlotsError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const selectedSlot = availableSlots.find(
      (slot) => slot.disponivel && getSlotHour(slot.inicio) === form.horarioSlot
    );

    if (!selectedSlot) {
      setError("Selecione um horário disponível");
      return;
    }

    setLoading(true);

    try {
      await createInspection({
        nome: form.nome,
        nomeEmbarcacao: form.nomeEmbarcacao,
        responsavelInspecao: form.responsavelInspecao,
        horarioInicio: selectedSlot.inicio,
        horarioFim: selectedSlot.fim,
      });

      setSuccess("Inspeção cadastrada com sucesso!");
      setForm(initialForm);
      setAvailableSlots([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar formulário");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="mx-auto w-full max-w-xl rounded-xl border bg-white p-4 shadow-sm sm:p-8"
      style={{ borderColor: "#d1dce6" }}
    >
      <div className="mb-5 text-center sm:mb-6">
        <h1 className="text-xl font-bold text-blue-900 sm:text-2xl">
          Formulário de Inspeção
        </h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Cadastro de inspeção de embarcação
        </p>
      </div>

      {success && <Alert type="success" message={success} />}
      {error && <Alert type="error" message={error} />}

      <form
        className="flex flex-col gap-5"
        onSubmit={handleSubmit}
        noValidate
        autoComplete="off"
      >
        <FormField
          id="nome"
          label="Nome"
          type="text"
          value={form.nome}
          onChange={(e) => handleChange("nome", e.target.value)}
          placeholder="Seu nome completo"
          disabled={loading}
        />

        <FormField
          id="nomeEmbarcacao"
          label="Nome da embarcação"
          type="text"
          value={form.nomeEmbarcacao}
          onChange={(e) => handleChange("nomeEmbarcacao", e.target.value)}
          placeholder="Ex: Barco Azul"
          disabled={loading}
        />

        <FormField
          id="responsavelInspecao"
          label="Responsável pela inspeção"
          type="text"
          value={form.responsavelInspecao}
          onChange={(e) => handleChange("responsavelInspecao", e.target.value)}
          placeholder="Nome do inspetor"
          disabled={loading}
        />

        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            id="dataInspecao"
            label="Data da inspeção"
            type="date"
            value={form.dataInspecao}
            min={today}
            onChange={(e) => handleChange("dataInspecao", e.target.value)}
            disabled={loading}
          />

          <div>
            <FormSelect
              id="horarioSlot"
              label="Horário"
              value={form.horarioSlot}
              onChange={(e) => handleChange("horarioSlot", e.target.value)}
              disabled={loading || !form.dataInspecao}
              loading={loadingSlots}
            >
              <option value="">
                {loadingSlots
                  ? "Carregando..."
                  : !form.dataInspecao
                    ? "Selecione a data primeiro"
                    : "Selecione um horário"}
              </option>
              {!loadingSlots &&
                availableSlots.map((slot) => {
                  const hour = getSlotHour(slot.inicio);

                  return (
                    <option
                      key={slot.inicio}
                      value={hour}
                      disabled={!slot.disponivel}
                    >
                      {formatSlotLabel(slot.inicio, slot.fim)}
                      {!slot.disponivel ? " (indisponível)" : ""}
                    </option>
                  );
                })}
            </FormSelect>
            {slotsError && (
              <p className="mt-1 text-xs text-red-600">{slotsError}</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || loadingSlots}
          className="mt-2 w-full rounded-lg px-6 py-3 text-base font-semibold text-white disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: "#1e5a8a" }}
        >
          {loading ? "Enviando..." : "Cadastrar inspeção"}
        </button>
      </form>
    </div>
  );
}
