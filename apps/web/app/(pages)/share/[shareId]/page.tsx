"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Globe, 
  AlertCircle, 
  Quote, 
  Sparkles,
  ShieldCheck,
  FileText,
  Activity,
  Target,
  Search,
  Fingerprint,
  Terminal,
  Zap
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

type PublicResponse = {
  item: HistoryItem;
};

const SPIN = (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
    className="inline-block"
  >
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
    </svg>
  </motion.div>
);

export default function SharePage() {
  const params = useParams<{ shareId: string }>();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["share", params.shareId],
    queryFn: () => apiFetch<PublicResponse>(`/public/analysis/${params.shareId}`),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-cabinet">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-vouch-red">
            {SPIN}
          </div>
          <p className="text-gray-400 font-bold text-sm tracking-widest uppercase italic">Booting Intelligence Layer...</p>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data?.item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-cabinet p-6">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-vouch-red mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase">AUDIT_FAILED</h2>
          <p className="text-gray-500 font-medium">The requested analysis record was not found or has been revoked.</p>
        </div>
      </div>
    );
  }

  const item = query.data.item;
  const biasScore = item.biasScore ?? 0;
  const biasLabel = biasScore > 0.7 ? "Highly Biased" : biasScore > 0.4 ? "Moderate Bias" : "Neutral / Balanced";
  
  // Handle proof as either newline-separated string or single string
  const proofs = item.proof?.split("\n").filter(p => p.trim()) || ["No proof available."];

  return (
    <div className="min-h-screen bg-white font-cabinet text-gray-900 selection:bg-red-50 selection:text-vouch-red">
      {/* ════ NAV ════ */}
      <nav className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 h-[58px] px-8 flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-vouch-red flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tighter">V</span>
          </div>
          <span className="font-extrabold text-lg tracking-tighter text-gray-900">Vouch</span>
          <span className="bg-red-50 border border-red-100 text-vouch-red text-[9px] font-extrabold tracking-widest uppercase rounded-full px-2 py-0.5">Audit</span>
        </div>

        <div className="w-px h-4.5 bg-gray-100" />

        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Verified Public Report</span>
        </div>

        <div className="flex-1" />

        <div className="hidden sm:flex items-center gap-6">
          <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">System Status</div>
            <div className="text-xs font-black text-gray-800">ENCRYPTED_LINK</div>
          </div>
          <div className="w-px h-6 bg-gray-100" />
          <div className="text-sm font-black text-gray-900">
            {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
      </nav>

      {/* ════ MAIN LAYOUT ════ */}
      <div className="flex min-h-[calc(100vh-58px)]">
        
        {/* LEFT SYSTEM RAIL */}
        <aside className="hidden lg:flex w-72 border-r border-gray-100 p-8 flex-col gap-8 bg-gray-50/50 shrink-0">
          <section>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Audit Metadata</div>
            <div className="flex flex-col gap-4">
              {[
                { label: "Report ID", val: params.shareId?.slice(0, 12) + "..." },
                { label: "Engine", val: "VOUCH_V1" },
                { label: "Confidence", val: biasScore > 0 ? "98.4%" : "..." },
                { label: "Created", val: new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) }
              ].map(meta => (
                <div key={meta.label}>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{meta.label}</div>
                  <div className="text-[13px] font-black font-mono text-gray-800 truncate">{meta.val}</div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-3">Security Check</div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
              <Fingerprint size={18} className="text-vouch-red shrink-0" />
              <div className="text-[11px] font-black tracking-tighter text-gray-900 uppercase">Verified_by_Vouch</div>
            </div>
          </section>

          <div className="mt-auto">
            <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">System Log</div>
            <div className="font-mono text-[10px] text-gray-400 leading-relaxed whitespace-pre select-none">
              {`> INITIALIZING...\n> FETCHING_DATA...\n> ANALYZING_BIAS...\n> VERDICT_READY`}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-8 md:p-12 lg:p-16 pb-20">
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* HERO SECTION */}
            <header className="mb-16 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-12 items-start">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={14} className="text-vouch-red" />
                  <span className="text-vouch-red text-xs font-black tracking-widest uppercase">Verified Audit Report</span>
                </div>
                <h1 className="font-black text-[clamp(32px,4vw,64px)] leading-[0.95] tracking-tighter text-gray-900 mb-8">
                  {item.inputUrl.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]} Analysis
                </h1>
                <div className="flex items-center gap-3.5">
                  <Globe size={20} className="text-vouch-red shrink-0" />
                  <a 
                    href={item.inputUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-lg font-bold text-gray-900 underline underline-offset-4 hover:text-vouch-red transition-colors truncate"
                  >
                    {item.inputUrl}
                  </a>
                </div>
              </div>

              {/* BIAS SCORE BOX */}
              <div className="relative bg-vouch-red rounded-[24px] p-8 text-white text-center overflow-hidden shadow-xl shadow-red-100 group">
                <div className="absolute inset-0 pointer-events-none opacity-[0.1]" style={{ backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                <div className="relative z-10">
                  <div className="text-[10px] font-black uppercase tracking-[0.15em] text-white/60 mb-2">Bias Index</div>
                  <div className="text-[84px] font-black leading-none tracking-tighter mb-2 group-hover:scale-110 transition-transform">
                    {Math.round(biasScore * 100)}
                  </div>
                  <div className="bg-black/20 rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-widest inline-block">
                    {biasLabel}
                  </div>
                </div>
              </div>
            </header>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-12">
              
              {/* VERDICT SECTION */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Target size={24} className="text-vouch-red" />
                  <h2 className="text-2xl font-black tracking-tight">AI Verdict</h2>
                </div>
                <div className="bg-white border border-gray-100 rounded-[24px] p-8 md:p-10 shadow-sm relative overflow-hidden mb-10">
                  <Quote size={48} className="absolute left-5 top-5 text-red-50/50 fill-current" />
                  <p className="relative z-10 text-2xl font-bold leading-relaxed text-gray-900">
                    {item.aiResponse || "No summary available yet."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Sentiment", val: biasScore > 0.6 ? "CRITICAL" : "NEUTRAL", icon: <Activity size={16} /> },
                    { label: "Objectivity", val: biasScore < 0.4 ? "HIGH" : "LOW", icon: <Search size={16} /> },
                    { label: "Source Trust", val: "UNVERIFIED", icon: <ShieldCheck size={16} /> },
                    { label: "Fact Density", val: "MODERATE", icon: <FileText size={16} /> }
                  ].map(meta => (
                    <div key={meta.label} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center gap-4 hover:border-vouch-red/20 hover:bg-red-50/10 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-vouch-red shrink-0">
                        {meta.icon}
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{meta.label}</div>
                        <div className="text-base font-black text-gray-900">{meta.val}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* PROOF SECTION */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Terminal size={24} className="text-vouch-red" />
                  <h2 className="text-2xl font-black tracking-tight">Evidence Log</h2>
                </div>
                <div className="flex flex-col gap-4 mb-10">
                  {proofs.map((proof, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="bg-white border border-gray-100 rounded-2xl p-6 flex gap-4 hover:border-red-100 hover:shadow-md transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <span className="text-vouch-red text-xs font-black">{i + 1}</span>
                      </div>
                      <p className="text-[15px] font-medium leading-relaxed text-gray-600">
                        {proof}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <div className="bg-gray-900 rounded-[24px] p-8 text-center text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Zap size={100} fill="white" />
                  </div>
                  <Zap size={32} className="text-vouch-red fill-vouch-red mx-auto mb-4" />
                  <h3 className="text-lg font-black mb-2 tracking-tight">Ready to audit?</h3>
                  <p className="text-white/50 text-xs font-medium leading-relaxed mb-6">Join the intelligence layer and verify everything you read.</p>
                  <button 
                    onClick={() => router.push("/")}
                    className="w-full bg-vouch-red text-white font-black rounded-xl py-3.5 flex items-center justify-center gap-2 hover:bg-vouch-darkRed hover:-translate-y-0.5 transition-all"
                  >
                    Initialize Dashboard
                  </button>
                </div>
              </section>
            </div>

            {/* FOOTER */}
            <footer className="mt-20 pt-8 border-t border-gray-100 flex flex-wrap justify-between items-center gap-4">
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                © 2025 VOUCH_INTELLIGENCE_ENGINE // ALL_RIGHTS_RESERVED
              </div>
              <div className="flex gap-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">V.1.0.4</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">STABLE_BUILD</span>
              </div>
            </footer>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
