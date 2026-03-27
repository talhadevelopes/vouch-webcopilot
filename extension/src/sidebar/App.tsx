import { useEffect, useState } from 'react';
import { CredibilityPanel } from './components/CredibilityPanel';
import { BiasPanel } from './components/BiasPanel';
import { ChatPanel } from './components/ChatPanel';
import { SelectedClaimResult } from './components/SelectedClaimResult';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { usePageData } from './hooks/usePageData';
import { useVerification } from './hooks/useVerification';
import { useClaimStream } from './hooks/useClaimStream';
import { saveHistory } from './hooks/useHistory';
import type { Tab, ChatMessage } from './types';

export default function App() {
  const {
    data, loading, restoredMessages, setRestoredMessages,
    chatKey, setChatKey, pageLoadIdRef, applyPageData,
  } = usePageData();

  const {
    claims, isVerifying, analysis, isAnalyzing,
    verifyEnabled, setVerifyEnabled, startVerification,
    startAnalysis, handleVerifyToggle, reset: resetVerification,
  } = useVerification();

  const {
    selectedClaimText, setSelectedClaimText,
    selectedClaimStreamText, isVerifyingSelected,
    vouchSelectedClaim, reset: resetClaim,
  } = useClaimStream();

  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [showSettings, setShowSettings] = useState(false);

  // Load verify preference
  useEffect(() => {
    chrome.storage.sync.get({ verifyEnabled: false }, (result) => {
      setVerifyEnabled(!!result.verifyEnabled);
    });
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === 'VOUCH_SELECTED_CLAIM') {
        resetClaim();
        setSelectedClaimText(message.text);
        setShowSettings(false);
        setActiveTab('claim');
        vouchSelectedClaim(message.text);
      }
      if (message.type === 'DATA_READY') {
        const payload = message.payload;
        if (!payload?.textContent) return;
        pageLoadIdRef.current++;
        resetVerification();
        resetClaim();
        setShowSettings(false);
        setRestoredMessages([]);
        applyPageData(payload);
        setActiveTab('chat');
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Save chat history on message changes
  const handleMessagesChange = (messages: ChatMessage[]) => {
    if (data?.url) saveHistory(data.url, data.title, messages);
  };

  // Scan page: run verify + bias together
  const refreshVerification = async () => {
    if (!data?.textContent || !verifyEnabled) return;
    const loadId = ++pageLoadIdRef.current;
    setActiveTab('facts');
    await Promise.all([
      startVerification(data.textContent, data.url, loadId, pageLoadIdRef),
      startAnalysis(data.textContent, data.url, loadId, pageLoadIdRef),
    ]);
  };

  // Toggle verification and close settings
  const onVerifyToggle = () => {
    handleVerifyToggle();
    setShowSettings(false);
    if (verifyEnabled) setActiveTab('chat');
  };

  // History entry restore
  const handleHistorySelect = (entry: { url: string; title: string; messages: ChatMessage[] }) => {
    setRestoredMessages(entry.messages);
    setChatKey((k) => k + 1);
    setActiveTab('chat');
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="v-screen-center">
        <img src="/logo.png" alt="Vouch" className="v-screen-logo" />
        <div className="v-screen-title">Analyzing article...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="v-screen-top">
        <img src="/logo.png" alt="Vouch" className="v-screen-logo-top" />
        <p style={{ color: '#666' }}>
          No article data found. Make sure you are on a news article page.
        </p>
      </div>
    );
  }

  const visibleTabs: Tab[] = verifyEnabled
    ? ['chat', 'facts', 'bias', 'claim', 'history']
    : ['chat', 'claim', 'history'];

  const tabLabel: Record<Tab, string> = {
    chat: 'Chat', facts: 'Verify', bias: 'Bias', claim: 'Vouch', history: 'History',
  };

  const contentClass = showSettings || activeTab !== 'chat' ? 'v-content' : 'v-content-noscroll';

  return (
    <div className="v-container">
      {/* Header */}
      <header className="v-header">
        <div className="v-header-logo-container">
          <img
            src="/logo.png"
            alt="Vouch"
            style={{ height: 40, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        </div>
        <div className="v-header-actions">
          <button
            onClick={() => setShowSettings((v) => !v)}
            title="Settings"
            className="v-settings-btn"
          >
            <span className="v-settings-icon">⚙</span>
          </button>
        </div>
      </header>

      {/* Nav */}
      {!showSettings && (
        <div className="v-nav">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setShowSettings(false); }}
              className={`v-nav-btn${activeTab === tab ? ' active' : ''}`}
            >
              {tabLabel[tab]}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className={contentClass}>
        {/* Page info card */}
        <div className="v-page-card">
          <h3 className="v-page-card-label">Analyzing</h3>
          <p className="v-page-card-title">{data.title}</p>
          <div className="v-page-card-meta">
            <span>{data.wordCount} words</span>
            <span className="v-page-card-url">{new URL(data.url).hostname}</span>
          </div>
        </div>

        {showSettings ? (
          <SettingsPanel
            verifyEnabled={verifyEnabled}
            onVerifyToggle={onVerifyToggle}
            onBack={() => { setShowSettings(false); setActiveTab('chat'); }}
          />
        ) : (
          <>
            {/* Facts tab */}
            {verifyEnabled && activeTab === 'facts' && (
              <>
                <div className="v-scan-bar">
                  <div>
                    <div className="v-scan-bar-title">Scan this page</div>
                    <div className="v-scan-bar-sub">Runs Verify (facts) + Bias together.</div>
                  </div>
                  <button
                    onClick={refreshVerification}
                    disabled={isVerifying || isAnalyzing}
                    className="v-scan-btn"
                    title="Scan page"
                  >
                    {isVerifying || isAnalyzing ? 'Scanning...' : 'Scan'}
                  </button>
                </div>
                <CredibilityPanel claims={claims} isVerifying={isVerifying} />
              </>
            )}

            {/* Bias tab */}
            {verifyEnabled && activeTab === 'bias' && (
              <BiasPanel analysis={analysis} isAnalyzing={isAnalyzing} />
            )}

            {/* Vouch (claim) tab */}
            {activeTab === 'claim' && (
              selectedClaimText ? (
                <SelectedClaimResult
                  selectedText={selectedClaimText}
                  streamText={selectedClaimStreamText}
                  isVerifying={isVerifyingSelected}
                  onDismiss={() => { resetClaim(); setActiveTab('chat'); }}
                />
              ) : (
                <div className="v-card-outlined">
                  Select some text on the page and use{' '}
                  <span style={{ color: '#dc2626', fontWeight: 900 }}>Vouch this</span>.
                </div>
              )
            )}

            {/* History tab */}
            {activeTab === 'history' && (
              <HistoryPanel onSelectEntry={handleHistorySelect} />
            )}

            {/* Chat tab */}
            {activeTab === 'chat' && data && (
              <ChatPanel
                key={chatKey}
                pageContent={data.textContent}
                computeSourceSentence={verifyEnabled}
                initialMessages={restoredMessages}
                onMessagesChange={handleMessagesChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}