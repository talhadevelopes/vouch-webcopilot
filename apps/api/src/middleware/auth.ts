import { createMiddleware } from "hono/factory";
import { verifyAccessToken } from "../services/auth/jwt";
import { ApiResponse } from "../utils/api-response";
import { prisma } from "../db/prisma";

export type AuthContext = {
  Variables: {
    userId: string;
    userEmail: string;
  };
};

export const requireAuth = createMiddleware<AuthContext>(async (c, next) => {
  const authHeader = c.req.header("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";
  const token = bearerToken;

  if (!token) {
    return ApiResponse.error(c, "Unauthorized", "UNAUTHORIZED", 401);
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      return ApiResponse.error(c, "Unauthorized", "UNAUTHORIZED", 401);
    }

    c.set("userId", user.id);
    c.set("userEmail", user.email);
    await next();
  } catch {
    return ApiResponse.error(c, "Unauthorized", "UNAUTHORIZED", 401);
  }
});
