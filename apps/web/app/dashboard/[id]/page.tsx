"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

type DetailResponse = {
  item: HistoryItem;
};

export default function DashboardDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const detailQuery = useQuery({
    queryKey: ["analysis", params.id],
    queryFn: () => apiFetch<DetailResponse>(`/dashboard/analysis/${params.id}`),
    retry: false,
  });

  if (detailQuery.isLoading) {
    return (
      <main className="container">
        <div className="card">Loading analysis...</div>
      </main>
    );
  }

  if (detailQuery.isError || !detailQuery.data?.item) {
    return (
      <main className="container">
        <div className="card">
          <p>Analysis not found or session expired.</p>
          <button className="btn btn-ghost" onClick={() => router.replace("/dashboard")} type="button">
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  const item = detailQuery.data.item;

  return (
    <main className="container">
      <motion.div className="card grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Analysis Detail</h1>
        <p>
          <strong>URL:</strong> {item.inputUrl}
        </p>
        <p>
          <strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}
        </p>
        <p>
          <strong>Bias Score:</strong> {item.biasScore ?? "N/A"}
        </p>
        <p>
          <strong>AI Response:</strong> {item.aiResponse ?? "No summary available yet."}
        </p>
        <p>
          <strong>Proof:</strong> {item.proof ?? "No proof captured yet."}
        </p>
        <div>
          <Link className="btn btn-ghost" href="/dashboard">
            Back
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
