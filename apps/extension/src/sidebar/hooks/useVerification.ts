import { useState, useRef } from 'react';
import { verifyPage, analyzePage, authFetch } from '../../lib/api';
import type { VerificationResult, AnalysisResult } from '../utils/types';

export function useVerification() {
  const [claims, setClaims] = useState<VerificationResult[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [verifyEnabled, setVerifyEnabled] = useState(false);
  const verifyEnabledRef = useRef(false);

  const startVerification = async (content: string, url: string, loadId: number, pageLoadIdRef: React.MutableRefObject<number>) => {
    setIsVerifying(true);
    setClaims([]);
    
    // Trigger permanent history save on Dashboard
    authFetch('/dashboard/analysis', {
      method: 'POST',
      body: JSON.stringify({ inputUrl: url, content })
    }).catch(err => console.error('Failed to sync extension scan to dashboard:', err));

    try {
      const { data } = await verifyPage(content, url);
      let parsedResults: VerificationResult[] = [];
      
      if (typeof data === 'string') {
        // Handle Newline-Delimited JSON (NDJSON)
        parsedResults = data
          .split('\n')
          .filter((l) => l.trim())
          .map((l) => {
            try {
              return JSON.parse(l) as VerificationResult;
            } catch (e) {
              console.warn("Failed to parse verification line:", l);
              return null;
            }
          })
          .filter((r): r is VerificationResult => r !== null);
      } else if (Array.isArray(data)) {
        parsedResults = data as VerificationResult[];
      } else if (data && typeof data === 'object' && 'claim' in data) {
        // Handle single object response
        parsedResults = [data as VerificationResult];
      }

      if (pageLoadIdRef.current !== loadId) return;
      
      const validClaims = parsedResults.filter((r) => r && r.claim);
      console.log("Verified claims:", validClaims);
      setClaims(validClaims);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      if (pageLoadIdRef.current === loadId) setIsVerifying(false);
    }
  };

  const startAnalysis = async (content: string, url: string, loadId: number, pageLoadIdRef: React.MutableRefObject<number>) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const { data } = await analyzePage(content, url);
      if (pageLoadIdRef.current !== loadId) return;
      setAnalysis(data);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      if (pageLoadIdRef.current === loadId) setIsAnalyzing(false);
    }
  };

  const handleVerifyToggle = () => {
    const newValue = !verifyEnabled;
    setVerifyEnabled(newValue);
    verifyEnabledRef.current = newValue;
    chrome.storage.sync.set({ verifyEnabled: newValue });
  };

  const reset = () => {
    setClaims([]);
    setIsVerifying(false);
    setAnalysis(null);
    setIsAnalyzing(false);
  };

  return {
    claims,
    isVerifying,
    analysis,
    isAnalyzing,
    verifyEnabled,
    setVerifyEnabled,
    verifyEnabledRef,
    startVerification,
    startAnalysis,
    handleVerifyToggle,
    reset,
  };
}
