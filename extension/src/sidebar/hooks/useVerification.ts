import { useState, useRef } from 'react';
import { verifyPage, analyzePage } from '../../lib/api';
import type { VerificationResult, AnalysisResult } from '../types';

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
    try {
      const { data } = await verifyPage(content, url);
      let parsedResults: VerificationResult[] = [];
      if (typeof data === 'string') {
        parsedResults = data.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l) as VerificationResult);
      } else if (Array.isArray(data)) {
        parsedResults = data;
      }
      if (pageLoadIdRef.current !== loadId) return;
      setClaims(parsedResults.filter((r) => r.claim));
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
      setAnalysis(data as AnalysisResult);
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
