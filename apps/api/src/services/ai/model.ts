import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../utils/env';

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
export const MODEL_NAME = 'gemini-2.5-flash';

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? err?.response?.status;
      const msg = String(err?.message || err || '');
      const isRetryable =
        status === 429 ||
        status === 503 ||
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('RESOURCE_EXHAUSTED');

      if (!isRetryable || attempt === maxAttempts) throw err;

      const waitMs = Math.pow(2, attempt) * 1000;
      console.warn(
        `[Vouch] Attempt ${attempt}/${maxAttempts} failed (${status || msg.substring(0, 80)}), retrying in ${waitMs}ms...`,
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

// Map raw errors to user-friendly messages.
export function getErrorMessage(err: any): string {
  const status = err?.status ?? err?.response?.status;
  const msg = String(err?.message || err || '').substring(0, 200);

  if (status === 429 || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return 'API rate limit reached. Please wait a minute and try again.';
  }
  if (status === 403 || msg.includes('PERMISSION_DENIED')) {
    return 'API key does not have permission. Please check your GEMINI_API_KEY.';
  }
  if (status === 400 || msg.includes('INVALID_ARGUMENT')) {
    return 'Invalid request to AI. The page content may be too long or contain unsupported characters.';
  }
  if (msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('network')) {
    return 'Network error connecting to Gemini API. Please check your internet connection.';
  }
  return `AI service error: ${msg || 'Unknown error'}`;
}

// Best-effort extraction of the first JSON object from text. 
export function extractJsonObject(text: string): Record<string, any> | null {
  const match = text.trim().match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}
