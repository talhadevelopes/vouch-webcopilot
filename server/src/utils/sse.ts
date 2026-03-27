// SSE (Server-Sent Events) stream helper. 
type SendFn = (payload: Record<string, unknown>) => void;

export function createSSEStream(
  handler: (send: SendFn) => Promise<void>,
): Response {
  let closed = false;
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    start(controller) {
      const send: SendFn = (payload) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
        }
      };

      (async () => {
        try {
          await handler(send);
        } catch (error) {
          console.error('[SSE] Stream handler error:', error);
        } finally {
          if (!closed) {
            closed = true;
            try {
              controller.close();
            } catch {
              //already closed
            }
          }
        }
      })();
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}