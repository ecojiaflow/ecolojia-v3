import { Router, Request, Response } from "express";
const router = Router();

// Stubs de compatibilité : retournent 501 si la vraie route n'existe pas.
// Objectif: ne plus casser le front quand ces endpoints sont absents.

router.post("/analysis", (req: Request, res: Response) => {
  return res.status(501).json({ ok: false, route: "/api/analysis", stub: true, message: "Not implemented here (compat route)." });
});

router.get("/search", (req: Request, res: Response) => {
  return res.status(501).json({ ok: false, route: "/api/search", stub: true, message: "Not implemented here (compat route)." });
});

router.post("/vision/analyze-image", (req: Request, res: Response) => {
  return res.status(501).json({ ok: false, route: "/api/vision/analyze-image", stub: true, message: "Not implemented here (compat route)." });
});

export default router;
