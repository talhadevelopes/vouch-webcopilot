"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, ExternalLink, Link2, LogOut, PlusCircle, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiFetch, clearAuthTokens } from "@/lib/api";
import type { HistoryItem, User } from "@/lib/types";
import { useAuthStore } from "@/store/auth-store";

type MeResponse = {
  user: User;
};

type HistoryResponse = {
  history: HistoryItem[];
};

type CreateAnalysisValues = {
  inputUrl: string;
};

function buildChartData(history: HistoryItem[]) {
  const map = new Map<string, number>();
  for (const item of history) {
    const day = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([day, count]) => ({ day, count }));
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAnalysisValues>();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => apiFetch<MeResponse>("/auth/me"),
    retry: false,
  });

  const historyQuery = useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<HistoryResponse>("/dashboard/history"),
    enabled: meQuery.isSuccess,
  });

  const createAnalysisMutation = useMutation({
    mutationFn: (values: CreateAnalysisValues) =>
      apiFetch<{ item: HistoryItem }>("/dashboard/analysis", {
        method: "POST",
        body: values,
      }),
    onSuccess: () => {
      reset();
      void queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: (analysisId: string) =>
      apiFetch<{ shareId: string }>(`/dashboard/analysis/${analysisId}/share`, { method: "POST" }),
    onSuccess: ({ shareId }) => {
      const url = `${window.location.origin}/share/${shareId}`;
      void navigator.clipboard.writeText(url);
      void queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });

  const linkCodeMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ code: string; expiresAt: string }>("/auth/extension/link-code", {
        method: "POST",
      }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiFetch("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      setUser(null);
      clearAuth();
      clearAuthTokens();
      router.replace("/login");
    },
  });

  useEffect(() => {
    if (meQuery.isSuccess) {
      setUser(meQuery.data.user);
    }
  }, [meQuery.isSuccess, meQuery.data, setUser]);

  useEffect(() => {
    if (meQuery.isError) {
      router.replace("/login");
    }
  }, [meQuery.isError, router]);

  if (meQuery.isLoading) {
    return (
      <main className="container">
        <div className="card">Loading dashboard...</div>
      </main>
    );
  }

  const history = historyQuery.data?.history ?? [];
  const chartData = buildChartData(history);
  const errorMessage =
    (createAnalysisMutation.error as Error | null)?.message ||
    (shareMutation.error as Error | null)?.message ||
    (linkCodeMutation.error as Error | null)?.message ||
    (logoutMutation.error as Error | null)?.message ||
    (historyQuery.error as Error | null)?.message ||
    "";

  return (
    <main className="container grid dashboard-grid">
      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Dashboard</h1>
        <p>Welcome {user?.name || user?.email}</p>
        <button className="btn btn-ghost" onClick={() => logoutMutation.mutate()} type="button">
          <LogOut size={16} />
          Logout
        </button>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2>New Analysis</h2>
        <form className="grid" onSubmit={handleSubmit((values) => createAnalysisMutation.mutate(values))}>
          <input
            className="input"
            placeholder="Paste article URL"
            {...register("inputUrl", { required: "Article URL is required" })}
          />
          {errors.inputUrl ? <p className="error-text">{errors.inputUrl.message}</p> : null}
          <button className="btn btn-primary" type="submit">
            <PlusCircle size={16} />
            Analyze
          </button>
        </form>
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2>
          <Smartphone size={18} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
          Link Extension
        </h2>
        <p>Generate a 6-digit code and enter it in extension settings.</p>
        <button className="btn btn-primary" onClick={() => linkCodeMutation.mutate()} type="button">
          Generate Link Code
        </button>
        {linkCodeMutation.data ? (
          <div className="card" style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 22, letterSpacing: 2 }}>
              {linkCodeMutation.data.code}
            </p>
            <p className="muted-text" style={{ marginTop: 6 }}>
              Expires at {new Date(linkCodeMutation.data.expiresAt).toLocaleTimeString()}
            </p>
          </div>
        ) : null}
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2>
          <BarChart3 size={18} style={{ verticalAlign: "text-bottom", marginRight: 6 }} />
          Analysis Activity
        </h2>
        {chartData.length === 0 ? (
          <p>No chart data yet.</p>
        ) : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      <motion.div className="card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2>History</h2>
        {history.length === 0 ? (
          <p>No analyses yet. Create your first one.</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => (
              <li key={item.id}>
                <strong>{item.inputUrl}</strong>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                <div className="history-actions">
                  <Link className="btn btn-ghost" href={`/dashboard/${item.id}`}>
                    <ExternalLink size={14} />
                    View
                  </Link>
                  <button className="btn btn-ghost" onClick={() => shareMutation.mutate(item.id)} type="button">
                    <Link2 size={14} />
                    {item.shareId ? "Copy Share Link" : "Share"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
    </main>
  );
}
