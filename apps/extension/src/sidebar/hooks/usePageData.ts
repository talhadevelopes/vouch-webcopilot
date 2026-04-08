import { useState, useRef, useEffect } from 'react';
import { loadHistory } from './useHistory';
import type { PageData, ChatMessage } from '../types';
import { requestPageData } from '../../shared/runtime-messages';

export function usePageData() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoredMessages, setRestoredMessages] = useState<ChatMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const pageLoadIdRef = useRef(0);

  const loadPageData = async (tabId: number): Promise<PageData | null> => requestPageData(tabId);

  const applyPageData = async (payload: PageData) => {
    const history = await loadHistory(payload.url);
    setRestoredMessages(history);
    setData(payload);
    setLoading(false);
    setChatKey((k) => k + 1);
  };

  // Tab switch: re-fetch from session storage
  useEffect(() => {
    const onTabActivated = async () => {
      pageLoadIdRef.current++;
      setData(null);
      setLoading(true);
      setRestoredMessages([]);
      setChatKey((k) => k + 1);

      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.id) { setLoading(false); return; }

      let attempts = 0;
      const tryFetch = async () => {
        const response = await loadPageData(tab.id!);
        if (response) {
          await applyPageData(response);
        } else if (attempts < 8) {
          attempts++;
          setTimeout(tryFetch, 500);
        } else {
          setLoading(false);
        }
      };
      tryFetch();
    };

    chrome.tabs.onActivated.addListener(onTabActivated);
    return () => chrome.tabs.onActivated.removeListener(onTabActivated);
  }, []);

  // Initial load
  useEffect(() => {
    const fetchData = async () => {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) { setLoading(false); return; }

      let attempts = 0;
      const tryFetch = async () => {
        const response = await loadPageData(tab.id!);
        if (response) {
          pageLoadIdRef.current++;
          await applyPageData(response);
        } else if (attempts < 10) {
          attempts++;
          setTimeout(tryFetch, 500);
        } else {
          setLoading(false);
        }
      };
      tryFetch();
    };
    fetchData();
  }, []);

  return {
    data,
    loading,
    restoredMessages,
    setRestoredMessages,
    chatKey,
    setChatKey,
    pageLoadIdRef,
    setData,
    setLoading,
    applyPageData,
  };
}