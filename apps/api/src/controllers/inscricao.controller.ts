import { Request, Response, NextFunction } from "express";
import { serializeInspection } from "../lib/date";
import { inscricaoService } from "../services/inscricao.service";
import { AppError } from "../middlewares/errorHandler";

export class InscricaoController {
  async listarInscricoes(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const inscricoes = await inscricaoService.listarInscricoes(req.user.permission);
      return res.status(200).json(inscricoes.map(serializeInspection));
    } catch (error) {
      next(error);
    }
  }
}

export const inscricaoController = new InscricaoController();
