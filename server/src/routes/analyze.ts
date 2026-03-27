import { Hono } from 'hono';
import { analyzeService } from '../services/ai/analyze';
import { cacheService } from '../services/cache';

const router = new Hono();

router.post('/', async (c) => {
  const { pageContent, pageUrl } = await c.req.json();

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const cacheKey = pageUrl ? `analyze:${pageUrl}` : null;

  if (cacheKey) {
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      console.log(`Cache hit for /analyze: ${pageUrl}`);
      return c.json(cached);
    }
  }

  try {
    const analysis = await analyzeService.analyzeLanguage(pageContent);
    
    if (cacheKey) {
      await cacheService.set(cacheKey, analysis);
    }

    return c.json(analysis);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default router;