const API_URL = import.meta.env.VITE_API_URL || 'https://vouch-server.fly.dev';

async function post(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  const data = await res.text();
  try {
    return { data: JSON.parse(data) };
  } catch {
    return { data };
  }
}

export const verifyPage = (pageContent: string, pageUrl: string) =>
  post('/verify', { pageContent, pageUrl });

export const analyzePage = (pageContent: string, pageUrl: string) =>
  post('/analyze', { pageContent, pageUrl });