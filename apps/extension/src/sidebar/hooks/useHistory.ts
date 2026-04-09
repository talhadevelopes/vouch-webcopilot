import type { ChatMessage } from '../utils/types';

export const HISTORY_TTL_MS = 48 * 60 * 60 * 1000; // 48 hours

function historyKey(url: string): string {
  return `vouch_history_${url}`;
}

export function saveHistory(url: string, title: string, messages: ChatMessage[]): void {
  if (!url || messages.length === 0) return;
  const entry = { url, title, messages, savedAt: Date.now() };
  chrome.storage.local.set({ [historyKey(url)]: entry });
}

export function loadHistory(url: string): Promise<ChatMessage[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(historyKey(url), (result) => {
      const entry = result[historyKey(url)];
      if (!entry) return resolve([]);
      if (Date.now() - entry.savedAt > HISTORY_TTL_MS) {
        chrome.storage.local.remove(historyKey(url));
        return resolve([]);
      }
      resolve(entry.messages ?? []);
    });
  });
}
