import { prisma } from "../../db/prisma";
import { ApiResponse } from "../../utils/api-response";
import type { Context } from "hono";
import { extensionCodeExchangeSchema } from "../../validators/auth.validator";
import { issueTokens } from "./core.controller";


export class ExtensionAuthController {

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