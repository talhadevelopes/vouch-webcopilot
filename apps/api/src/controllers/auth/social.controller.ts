import { prisma } from "../../db/prisma";
import { hashPassword } from "../../services/auth/password";
import { ApiResponse } from "../../utils/api-response";
import type { Context } from "hono";
import { googleLoginSchema } from "../../validators/auth.validator";
import type { GoogleTokenInfo } from "../../types";
import { issueTokens } from "./core.controller";



export class SocialAuthController {
    static async googleLogin(c: Context) {
    const parsed = googleLoginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const verifyRes = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(parsed.data.accessToken)}`,
    );
    if (!verifyRes.ok) {
      return ApiResponse.error(c, "Invalid Google token", "UNAUTHORIZED", 401);
    }

    const tokenInfo = (await verifyRes.json()) as GoogleTokenInfo
    if (!tokenInfo.email) {
      return ApiResponse.error(c, "Google account email is missing", "UNAUTHORIZED", 401);
    }

    const email = tokenInfo.email.toLowerCase();
    const name = tokenInfo.name?.trim() || email.split("@")[0] || "Google User";
    const fallbackHash = await hashPassword(`google_${crypto.randomUUID()}`);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name, authProvider: "google" },
      create: {
        id: `usr_${crypto.randomUUID()}`,
        email,
        name,
        passwordHash: fallbackHash,
        authProvider: "google",
      },
    });

    const { accessToken, refreshToken } = await issueTokens(user);
    return ApiResponse.success(c, "Google login successful", {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  }
}