import { InspectionLocation, InspectionStatus, Permission } from "@prisma/client";

import { prisma } from "../lib/prisma";

import { assertCanReadWrite } from "../lib/permissions";

import { AppError } from "../middlewares/errorHandler";

import { availabilityService } from "./availability.service";



export interface CreateInspectionInput {

  nome: string;

  nomeEmbarcacao: string;

  responsavelInspecao: string;

  celular: string;

  local: InspectionLocation;

  horarioInicio: Date;

  horarioFim: Date;

}



export interface UpdateInspectionInput extends CreateInspectionInput {
  observacoes?: string | null;
  status: InspectionStatus;
}



const MIN_LENGTH = 2;

const MAX_LENGTH = 200;



function validateString(value: string, fieldName: string): string {

  const trimmed = value.trim();



  if (!trimmed) {

    throw new AppError(400, `${fieldName} é obrigatório`);

  }



  if (trimmed.length < MIN_LENGTH) {

    throw new AppError(400, `${fieldName} deve ter pelo menos ${MIN_LENGTH} caracteres`);

  }



  if (trimmed.length > MAX_LENGTH) {

    throw new AppError(400, `${fieldName} deve ter no máximo ${MAX_LENGTH} caracteres`);

  }



  return trimmed;

}



const MAX_OBSERVACOES_LENGTH = 2000;



function validateObservacoes(value?: string | null): string | null {
  if (value == null) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > MAX_OBSERVACOES_LENGTH) {
    throw new AppError(
      400,
      `Observações devem ter no máximo ${MAX_OBSERVACOES_LENGTH} caracteres`
    );
  }

  return trimmed;
}



function validateInspectionData(data: CreateInspectionInput) {

  const nome = validateString(data.nome, "Nome");

  const nomeEmbarcacao = validateString(data.nomeEmbarcacao, "Nome da embarcação");

  const responsavelInspecao = validateString(

    data.responsavelInspecao,

    "Responsável pela inspeção"

  );

  const celular = validateString(data.celular, "Celular");



  if (!(data.horarioInicio instanceof Date) || isNaN(data.horarioInicio.getTime())) {

    throw new AppError(400, "Horário de início inválido");

  }



  if (!(data.horarioFim instanceof Date) || isNaN(data.horarioFim.getTime())) {

    throw new AppError(400, "Horário de fim inválido");

  }



  if (data.horarioFim <= data.horarioInicio) {

    throw new AppError(400, "Horário de fim deve ser posterior ao horário de início");

  }



  return {

    nome,

    nomeEmbarcacao,

    responsavelInspecao,

    celular,

    local: data.local,

    horarioInicio: data.horarioInicio,

    horarioFim: data.horarioFim,

  };

}



export class InspectionService {

  async create(data: CreateInspectionInput) {

    const validated = validateInspectionData(data);



    const slot = await availabilityService.findBookableSlot(

      validated.local,

      validated.horarioInicio,

      validated.horarioFim

    );



    return prisma.inspection.create({

      data: {

        ...validated,

        availabilitySlotId: slot.id,

      },

    });

  }



  async getAvailableDates(local: InspectionLocation): Promise<string[]> {

    return availabilityService.getAvailableDates(local);

  }



  async getAvailableSlots(local: InspectionLocation, dataInspecao: string) {

    return availabilityService.getSlotsForDay(local, dataInspecao);

  }



  async update(id: string, data: UpdateInspectionInput, permission: Permission) {
    assertCanReadWrite(permission);

    const existing = await prisma.inspection.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Inspeção não encontrada");
    }

    const validated = validateInspectionData(data);
    const observacoes = validateObservacoes(data.observacoes);

    const slot = await availabilityService.findBookableSlot(
      validated.local,
      validated.horarioInicio,
      validated.horarioFim,
      id
    );

    return prisma.inspection.update({
      where: { id },
      data: {
        ...validated,
        observacoes,
        status: data.status,
        availabilitySlotId: slot.id,
      },
    });
  }



  async delete(id: string, permission: Permission): Promise<void> {

    assertCanReadWrite(permission);



    const existing = await prisma.inspection.findUnique({

      where: { id },

    });



    if (!existing) {

      throw new AppError(404, "Inspeção não encontrada");

    }



    await prisma.inspection.delete({

      where: { id },

    });

  }

}



export const inspectionService = new InspectionService();

