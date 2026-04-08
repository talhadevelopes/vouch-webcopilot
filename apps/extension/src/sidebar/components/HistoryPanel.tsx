import React from 'react';
import type { ChatMessage } from '../types';
import { HISTORY_TTL_MS } from '../hooks/useHistory';

interface HistoryEntry {
  url: string;
  title: string;
  messages: ChatMessage[];
  savedAt: number;
}

interface HistoryPanelProps {
  onSelectEntry: (entry: HistoryEntry) => void;
}

function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));
  if (hours >= 1) return `${hours}h ago`;
  if (minutes >= 1) return `${minutes}m ago`;
  return 'just now';
}

function expiresIn(savedAt: number): string {
  const remaining = HISTORY_TTL_MS - (Date.now() - savedAt);
  const h = Math.floor(remaining / (1000 * 60 * 60));
  const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  if (h > 0) return `Expires in ${h}h ${m}m`;
  if (m > 0) return `Expires in ${m}m`;
  return 'Expiring soon';
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ onSelectEntry }) => {
  const [entries, setEntries] = React.useState<HistoryEntry[]>([]);

  React.useEffect(() => {
    chrome.storage.local.get(null, (items) => {
      const now = Date.now();
      const toDelete: string[] = [];
      const valid: HistoryEntry[] = [];

      for (const [key, value] of Object.entries(items)) {
        if (!key.startsWith('vouch_history_')) continue;
        const entry = value as HistoryEntry;
        if (now - entry.savedAt > HISTORY_TTL_MS) {
          toDelete.push(key);
        } else {
          valid.push(entry);
        }
      }

      if (toDelete.length > 0) {
        chrome.storage.local.remove(toDelete);
      }

      valid.sort((a, b) => b.savedAt - a.savedAt);
      setEntries(valid);
    });
  }, []);

  if (entries.length === 0) {
    return (
      <div className="v-history-empty">
        <p style={{ marginBottom: 8 }}>No history yet.</p>
        <p style={{ margin: 0, fontSize: 11 }}>
          Chat on any article and it will appear here for 72 hours.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="v-history-list">
        {entries.map((entry) => (
          <div
            key={entry.url}
            className="v-history-item"
            onClick={() => onSelectEntry(entry)}
          >
            <div className="v-history-item-url" title={entry.url}>
              {entry.title || new URL(entry.url).hostname}
            </div>
            <div className="v-history-item-meta">
              <span>{entry.messages.filter((m) => m.sender === 'user').length} messages · {timeAgo(entry.savedAt)}</span>
              <span className="v-history-item-expiry">{expiresIn(entry.savedAt)}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="v-history-notice">⏱ Conversations are kept for 72 hours only</p>
    </div>
  );
};
