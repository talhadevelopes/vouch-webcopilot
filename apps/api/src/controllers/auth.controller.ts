import type { Context } from "hono";
import { comparePassword, hashPassword } from "../services/auth/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../services/auth/jwt";
import { ApiResponse } from "../utils/api-response";
import { prisma } from "../db/prisma";
import {
  extensionCodeExchangeSchema,
  googleLoginSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  refreshSchema,
  registerSchema,
  setPasswordSchema,
} from "../validators/auth.validator";
import { env } from "../config/env";
import { sendOtpEmail } from "../services/auth/mail";

type GoogleTokenInfo = {
  email?: string;
  name?: string;
  aud?: string;
};

async function issueTokens(user: { id: string; email: string }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email });
  const refreshToken = signRefreshToken({ sub: user.id, email: user.email });
  await prisma.refreshToken.upsert({
    where: { userId: user.id },
    update: { token: refreshToken },
    create: { userId: user.id, token: refreshToken },
  });
  return { accessToken, refreshToken };
}

export class AuthController {
  static async register(c: Context) {
    const parsed = registerSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return ApiResponse.error(c, "User already exists", "CONFLICT", 409);
    }

    const user = await prisma.user.create({
      data: {
        id: `usr_${crypto.randomUUID()}`,
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash: await hashPassword(password),
      },
    });

    const { accessToken, refreshToken } = await issueTokens(user);

    return ApiResponse.success(
      c,
      "Registration successful",
      { user: { id: user.id, email: user.email, name: user.name }, accessToken, refreshToken },
      201,
    );
  }

  static async login(c: Context) {
    const parsed = loginSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return ApiResponse.error(c, "Invalid credentials", "UNAUTHORIZED", 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return ApiResponse.error(c, "Invalid credentials", "UNAUTHORIZED", 401);
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    return ApiResponse.success(c, "Login successful", {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  }

  static async demoLogin(c: Context) {
    const demoPasswordHash = await hashPassword("demo1234");
    const demoEmail = "demo@vouch.app";
    let user = await prisma.user.findUnique({ where: { email: demoEmail } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: `usr_${crypto.randomUUID()}`,
          email: demoEmail,
          name: "Demo User",
          passwordHash: demoPasswordHash,
        },
      });
    }

    const { accessToken, refreshToken } = await issueTokens(user);

    return ApiResponse.success(c, "Demo login successful", {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  }

  static async refresh(c: Context) {
    const parsed = refreshSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { refreshToken } = parsed.data;

    try {
      const payload = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return ApiResponse.error(c, "Unauthorized", "UNAUTHORIZED", 401);
      }

      const stored = await prisma.refreshToken.findUnique({ where: { userId: user.id } });
      if (!stored || stored.token !== refreshToken) {
        return ApiResponse.error(c, "Invalid refresh token", "UNAUTHORIZED", 401);
      }

      const { accessToken: newAccess, refreshToken: newRefresh } = await issueTokens(user);

      return ApiResponse.success(c, "Token refreshed", { accessToken: newAccess, refreshToken: newRefresh });
    } catch {
      return ApiResponse.error(c, "Invalid refresh token", "UNAUTHORIZED", 401);
    }
  }

  static async me(c: Context) {
    const userId = c.get("userId");
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return ApiResponse.error(c, "Unauthorized", "UNAUTHORIZED", 401);
    }
    return ApiResponse.success(c, "Current user fetched", {
      user: { id: user.id, email: user.email, name: user.name },
    });
  }

  static async logout(c: Context) {
    const userId = c.get("userId");
    await prisma.refreshToken.deleteMany({ where: { userId } });
    return ApiResponse.success(c, "Logout successful", { ok: true });
  }

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

    const tokenInfo = (await verifyRes.json()) as GoogleTokenInfo;
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

  static async requestOtp(c: Context) {
    const parsed = otpRequestSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        id: `otp_${crypto.randomUUID()}`,
        email,
        code,
        expiresAt,
      },
    });

    try {
      await sendOtpEmail(email, code);
    } catch (error) {
      return ApiResponse.error(
        c,
        error instanceof Error ? error.message : "Unable to send OTP",
        "MAIL_ERROR",
        500,
      );
    }

    return ApiResponse.success(c, "OTP sent successfully", { email });
  }

  static async verifyOtp(c: Context) {
    const parsed = otpVerifySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const email = parsed.data.email.toLowerCase();
    const code = parsed.data.code;
    const name = parsed.data.name?.trim();

    const otp = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return ApiResponse.error(c, "Invalid or expired OTP", "UNAUTHORIZED", 401);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    const user =
      existing ??
      (await prisma.user.create({
        data: {
          id: `usr_${crypto.randomUUID()}`,
          email,
          name: name || email.split("@")[0] || "OTP User",
          passwordHash: await hashPassword(`otp_${crypto.randomUUID()}`),
          authProvider: "otp",
        },
      }));

    if (existing && name && existing.name !== name) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { name },
      });
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date(), userId: user.id },
    });

    const { accessToken, refreshToken } = await issueTokens(user);
    return ApiResponse.success(c, "OTP login successful", {
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
    });
  }

  static async setPassword(c: Context) {
    const userId = c.get("userId");
    const parsed = setPasswordSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const { password } = parsed.data;
    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return ApiResponse.success(c, "Password updated successfully", { ok: true });
  }

  static async createExtensionLinkCode(c: Context) {
    const userId = c.get("userId");
    const now = new Date();

    // Look for a valid existing code first
    const existing = await prisma.extensionLinkCode.findFirst({
      where: {
        userId,
        consumedAt: null,
        expiresAt: { gt: now },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existing) {
      return ApiResponse.success(c, "Existing code reused", {
        code: existing.code,
        expiresAt: existing.expiresAt,
      });
    }

    const code = `${Math.floor(100000 + Math.random() * 900000)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await prisma.extensionLinkCode.create({
      data: {
        id: `xlc_${crypto.randomUUID()}`,
        code,
        userId,
        expiresAt,
      },
    });

    return ApiResponse.success(c, "Extension link code created", { code, expiresAt });
  }

  static async exchangeExtensionLinkCode(c: Context) {
    const parsed = extensionCodeExchangeSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }

    const code = parsed.data.code;
    const link = await prisma.extensionLinkCode.findFirst({
      where: {
        code,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!link) {
      return ApiResponse.error(c, "Invalid or expired code", "UNAUTHORIZED", 401);
    }

    await prisma.extensionLinkCode.update({
      where: { id: link.id },
      data: { consumedAt: new Date() },
    });

    const { accessToken, refreshToken } = await issueTokens(link.user);
    return ApiResponse.success(c, "Extension linked successfully", {
      user: { id: link.user.id, email: link.user.email, name: link.user.name },
      accessToken,
      refreshToken,
    });
  }
}