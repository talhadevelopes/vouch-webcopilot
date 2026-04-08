import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(20),
});

export const otpRequestSchema = z.object({
  email: z.string().email(),
});

export const otpVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export const extensionCodeExchangeSchema = z.object({
  code: z.string().length(6),
});
