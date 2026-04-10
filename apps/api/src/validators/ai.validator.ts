import { z } from "zod";

export const analyzeSchema = z.object({
  pageContent: z.string().min(20),
  pageUrl: z.string().url().optional(),
});

export const verifySchema = z.object({
  pageContent: z.string().min(20).optional(),
  pageUrl: z.string().url().optional(),
  claim: z.string().min(3).optional(),
  streamResponse: z.boolean().optional(),
});

export const chatSchema = z.object({
  pageContent: z.string().min(20),
  message: z.string().min(1).optional(),
  messages: z
    .array(
      z.object({
        sender: z.enum(["user", "vouch"]),
        text: z.string().min(1),
      }),
    )
    .optional(),
  computeSourceSentence: z.boolean().optional(),
});

export const scanSchema = z.object({
  pageContent: z.string().min(20),
  pageUrl: z.string().url().optional(),
});
