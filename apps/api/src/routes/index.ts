import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { inspectionController } from "../controllers/inspection.controller";
import { inscricaoController } from "../controllers/inscricao.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));
router.get("/me", (req, res, next) => authController.me(req, res, next));

router.post("/inspections/horariosDisponiveis", (req, res, next) =>
  inspectionController.getAvailableSlots(req, res, next)
);
router.post("/inspections", (req, res, next) =>
  inspectionController.create(req, res, next)
);

router.get("/inscricoes", (req, res, next) =>
  inscricaoController.listarInscricoes(req, res, next)
);

export default router;
