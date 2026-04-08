"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { HistoryItem } from "@/lib/types";

type PublicResponse = {
  item: HistoryItem;
};

export default function SharePage() {
  const params = useParams<{ shareId: string }>();
  const query = useQuery({
    queryKey: ["share", params.shareId],
    queryFn: () => apiFetch<PublicResponse>(`/public/analysis/${params.shareId}`),
    retry: false,
  });

  if (query.isLoading) {
    return (
      <main className="container">
        <div className="card">Loading shared analysis...</div>
      </main>
    );
  }

  if (query.isError || !query.data?.item) {
    return (
      <main className="container">
        <div className="card">Shared analysis was not found.</div>
      </main>
    );
  }

  const item = query.data.item;

  return (
    <main className="container">
      <motion.div className="card grid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Shared Analysis</h1>
        <p>
          <strong>Source URL:</strong> {item.inputUrl}
        </p>
        <p>
          <strong>Bias Score:</strong> {item.biasScore ?? "N/A"}
        </p>
        <p>
          <strong>AI Response:</strong> {item.aiResponse ?? "No summary available."}
        </p>
        <p>
          <strong>Proof:</strong> {item.proof ?? "No proof available."}
        </p>
        <p>
          <strong>Created:</strong> {new Date(item.createdAt).toLocaleString()}
        </p>
      </motion.div>
    </main>
  );
}
