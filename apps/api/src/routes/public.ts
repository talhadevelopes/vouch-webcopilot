import { Hono } from "hono";
import { DashboardController } from "../controllers/dashboard.controller";

const router = new Hono();

router.get("/analysis/:shareId", DashboardController.getPublicAnalysis);

export default router;
