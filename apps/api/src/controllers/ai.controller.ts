import type { Context } from "hono";
import { stream } from "hono/streaming";
import { analyzeService } from "../services/ai/analyze";
import { chatService } from "../services/ai/chat";
import { verifyService } from "../services/ai/verify";
import { cacheService } from "../services/cache";
import { createSSEStream } from "../utils/sse";
import { ApiResponse } from "../utils/api-response";
import { analyzeSchema, chatSchema, verifySchema } from "../validators/ai.validator";

export class AIController {
  static async analyze(c: Context) {
    const parsed = analyzeSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { pageContent, pageUrl } = parsed.data;
    const cacheKey = pageUrl ? `analyze:${pageUrl}` : null;

    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return ApiResponse.success(c, "Analysis fetched from cache", cached);
      }
    }

    try {
      const analysis = await analyzeService.analyzeLanguage(pageContent);
      if (cacheKey) await cacheService.set(cacheKey, analysis);
      return ApiResponse.success(c, "Analysis completed", analysis);
    } catch (error: any) {
      return ApiResponse.error(c, error?.message || "Analysis failed", "ANALYZE_ERROR", 500);
    }
  }

  static async verify(c: Context) {
    const parsed = verifySchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { pageContent, pageUrl, claim, streamResponse } = parsed.data;

    if (typeof claim === "string" && claim.trim().length > 0 && streamResponse) {
      return createSSEStream(async (send) => {
        const fullText = await verifyService.verifyClaimStream(claim.trim(), (token) =>
          send({ type: "token", text: token }),
        );
        send({ type: "final", text: fullText });
      });
    }

    if (typeof claim === "string" && claim.trim().length > 0) {
      const result = await verifyService.verifyClaim(claim.trim());
      return stream(c, async (s) => {
        await s.write(JSON.stringify(result) + "\n");
      });
    }

    if (!pageContent) {
      return ApiResponse.error(c, "pageContent is required", "VALIDATION_ERROR", 400);
    }

    const cacheKey = pageUrl ? `verify:${pageUrl}` : null;
    if (cacheKey) {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return stream(c, async (s) => {
          const results = Array.isArray(cached) ? cached : [cached];
          for (const res of results) {
            await s.write(JSON.stringify(res) + "\n");
          }
        });
      }
    }

    return stream(c, async (s) => {
      const results = await verifyService.extractAndVerifyClaims(pageContent);
      for (const result of results) {
        await s.write(JSON.stringify(result) + "\n");
      }
      if (cacheKey && results.length > 0) {
        await cacheService.set(cacheKey, results);
      }
    });
  }

  static async chat(c: Context) {
    const parsed = chatSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return ApiResponse.error(c, "Invalid request body", "VALIDATION_ERROR", 400, parsed.error.flatten());
    }
    const { message, pageContent, messages, computeSourceSentence } = parsed.data;
    const chatMessages =
      Array.isArray(messages) && messages.length > 0
        ? messages
        : typeof message === "string" && message.trim().length > 0
          ? [{ sender: "user" as const, text: message }]
          : [];

    if (chatMessages.length === 0) {
      return ApiResponse.error(c, "message or messages are required", "VALIDATION_ERROR", 400);
    }

    return createSSEStream(async (send) => {
      const { answer, sourceSentence } = await chatService.chatStream(
        chatMessages,
        pageContent,
        (token) => send({ type: "token", text: token }),
        computeSourceSentence !== false,
      );
      send({ type: "final", answer, sourceSentence });
    });
  }
}
