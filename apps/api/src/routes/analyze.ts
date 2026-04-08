import { Hono } from "hono";
import { AIController } from "../controllers/ai.controller";
import { requireAuth, type AuthContext } from "../middleware/auth";

const router = new Hono<AuthContext>();

router.post("/", requireAuth, AIController.analyze);

export default router;