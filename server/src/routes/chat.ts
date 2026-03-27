import { Hono } from 'hono';
import { chatService } from '../services/ai/chat';
import { createSSEStream } from '../utils/sse';

const router = new Hono();

router.post('/', async (c) => {
  const { message, pageContent, messages, computeSourceSentence } = await c.req.json();

  if (!pageContent) {
    return c.json({ error: 'pageContent is required' }, 400);
  }

  const chatMessages =
    Array.isArray(messages) && messages.length > 0
      ? messages
      : typeof message === 'string' && message.trim().length > 0
        ? [{ sender: 'user', text: message }]
        : [];

  if (chatMessages.length === 0) {
    return c.json({ error: 'message or messages are required' }, 400);
  }

  return createSSEStream(async (send) => {
    const { answer, sourceSentence } = await chatService.chatStream(
      chatMessages,
      pageContent,
      (token) => send({ type: 'token', text: token }),
      computeSourceSentence !== false,
    );

    send({
      type: 'final',
      answer,
      sourceSentence,
    });
  });
});

export default router;