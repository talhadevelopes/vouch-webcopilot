import { Hono } from "hono";
import { requireAuth, type AuthContext } from "../middleware/auth";
import { CoreAuthController } from "../controllers/auth/core.controller";
import { SocialAuthController } from "../controllers/auth/social.controller";
import { OTPController } from "../controllers/auth/otp.controller";
import { ExtensionAuthController } from "../controllers/auth/extension.controller";

const router = new Hono<AuthContext>();
        
router.post("/register", CoreAuthController.register);
router.post("/login", CoreAuthController.login);
router.post("/google", SocialAuthController.googleLogin);
router.post("/otp/request", OTPController.requestOtp);
router.post("/otp/verify", OTPController.verifyOtp);
router.post("/set-password", requireAuth, OTPController.setPassword);
router.post("/extension/link-code", requireAuth, ExtensionAuthController.createExtensionLinkCode);
router.post("/extension/link-code/exchange", ExtensionAuthController.exchangeExtensionLinkCode);
router.post("/demo-login", CoreAuthController.demoLogin);
router.post("/refresh", CoreAuthController.refresh);
router.get("/me", requireAuth, CoreAuthController.me);
router.post("/logout", requireAuth, CoreAuthController.logout);

export default router;
