import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { availabilityController } from "../controllers/availability.controller";
import { inspectionController } from "../controllers/inspection.controller";
import { inscricaoController } from "../controllers/inscricao.controller";
import { userController } from "../controllers/user.controller";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.post("/login", (req, res, next) => authController.login(req, res, next));
router.post("/logout", (req, res, next) => authController.logout(req, res, next));
router.get("/me", (req, res, next) => authController.me(req, res, next));

router.get("/disponibilidades", (req, res, next) =>
  availabilityController.list(req, res, next)
);
router.post("/disponibilidades", (req, res, next) =>
  availabilityController.create(req, res, next)
);
router.put("/disponibilidades/:id", (req, res, next) =>
  availabilityController.update(req, res, next)
);
router.delete("/disponibilidades/:id", (req, res, next) =>
  availabilityController.delete(req, res, next)
);

router.post("/inspections/datasDisponiveis", (req, res, next) =>
  inspectionController.getAvailableDates(req, res, next)
);
router.post("/inspections/horariosDisponiveis", (req, res, next) =>
  inspectionController.getAvailableSlots(req, res, next)
);
router.post("/inspections", (req, res, next) =>
  inspectionController.create(req, res, next)
);
router.put("/inspections/:id", (req, res, next) =>
  inspectionController.update(req, res, next)
);
router.delete("/inspections/:id", (req, res, next) =>
  inspectionController.delete(req, res, next)
);

router.get("/inscricoes", (req, res, next) =>
  inscricaoController.listarInscricoes(req, res, next)
);

router.post("/usuarios", (req, res, next) =>
  userController.create(req, res, next)
);
router.get("/usuarios", (req, res, next) =>
  userController.list(req, res, next)
);
router.put("/usuarios/:id", (req, res, next) =>
  userController.update(req, res, next)
);
router.delete("/usuarios/:id", (req, res, next) =>
  userController.delete(req, res, next)
);

export default router;
