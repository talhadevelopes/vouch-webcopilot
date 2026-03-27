import { Hono } from 'hono';
import { stream } from 'hono/streaming';
import { verifyService } from '../services/ai/verify';
import { cacheService } from '../services/cache';
import { createSSEStream } from '../utils/sse';

const router = new Hono();

router.post('/', async (c) => {
  const { pageContent, pageUrl, claim, streamResponse } = await c.req.json();

  // Streaming single claim verification (used by "Vouch this")
  if (typeof claim === 'string' && claim.trim().length > 0 && streamResponse) {
    return createSSEStream(async (send) => {
      const fullText = await verifyService.verifyClaimStream(
        claim.trim(),
        (token) => send({ type: 'token', text: token }),
      );
      send({ type: 'final', text: fullText });
    });
  }

  // Non-streaming single claim
  if (typeof claim === 'string' && claim.trim().length > 0) {
    const result = await verifyService.verifyClaim(claim.trim());
    return stream(c, async (s) => {
      await s.write(JSON.stringify(result) + '\n');
    });
  }

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const cacheKey = pageUrl ? `verify:${pageUrl}` : null;

  if (cacheKey) {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for /verify: ${pageUrl}`);
      return stream(c, async (s) => {
        const results = Array.isArray(cached) ? cached : [cached];
        for (const res of results) {
          await s.write(JSON.stringify(res) + '\n');
        }
      });
    }
  }

  // Scan — single Gemini call that extracts and verifies in one shot
  return stream(c, async (s) => {
    const results = await verifyService.extractAndVerifyClaims(pageContent);
    for (const result of results) {
      await s.write(JSON.stringify(result) + '\n');
    }
    if (cacheKey && results.length > 0) {
      await cacheService.set(cacheKey, results);
    }
  });
});

export default router;