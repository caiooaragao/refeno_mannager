import { Permission } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        login: string;
        permission: Permission;
      };
    }
  }
}

export {};
