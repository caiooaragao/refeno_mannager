import { NextFunction, Request, Response } from "express";

const isDevelopment = process.env.NODE_ENV !== "production";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err.stack ?? err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(isDevelopment && { stack: err.stack }),
    });
  }

  return res.status(500).json({
    error: "Erro interno do servidor",
    ...(isDevelopment && { stack: err.stack }),
  });
}
