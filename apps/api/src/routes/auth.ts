import { Hono } from "hono";
import { requireAuth, type AuthContext } from "../middleware/auth";
import { AuthController } from "../controllers/auth.controller";

const router = new Hono<AuthContext>();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/google", AuthController.googleLogin);
router.post("/otp/request", AuthController.requestOtp);
router.post("/otp/verify", AuthController.verifyOtp);
router.post("/extension/link-code", requireAuth, AuthController.createExtensionLinkCode);
router.post("/extension/link-code/exchange", AuthController.exchangeExtensionLinkCode);
router.post("/demo-login", AuthController.demoLogin);
router.post("/refresh", AuthController.refresh);
router.get("/me", requireAuth, AuthController.me);
router.post("/logout", requireAuth, AuthController.logout);

export default router;
