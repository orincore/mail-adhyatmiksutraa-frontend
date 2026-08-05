"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw, Send, CheckCheck, Eye, XCircle, MousePointerClick, Clock, MessageCircle, User } from "lucide-react";

interface AnalyticsTotal {
  total: number;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  clicked: number;
  avgDeliveryTime: number;
  businessInitiated: number;
  userInitiated: number;
  marketing: number;
  authentication: number;
  utility: number;
}

function defaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

const TILES: { key: keyof AnalyticsTotal; label: string; icon: React.ComponentType<{ className?: string }>; tint: string }[] = [
  { key: "sent", label: "Sent", icon: Send, tint: "bg-violet-50 text-violet-600" },
  { key: "delivered", label: "Delivered", icon: CheckCheck, tint: "bg-sky-50 text-sky-600" },
  { key: "read", label: "Read", icon: Eye, tint: "bg-teal-50 text-teal-600" },
  { key: "failed", label: "Failed", icon: XCircle, tint: "bg-rose-50 text-rose-600" },
  { key: "clicked", label: "Clicked", icon: MousePointerClick, tint: "bg-fuchsia-50 text-fuchsia-600" },
  { key: "businessInitiated", label: "Business-initiated", icon: MessageCircle, tint: "bg-indigo-50 text-indigo-600" },
  { key: "userInitiated", label: "User-initiated", icon: User, tint: "bg-amber-50 text-amber-600" },
  { key: "avgDeliveryTime", label: "Avg delivery time", icon: Clock, tint: "bg-slate-100 text-slate-600" },
];

export default function AnalyticsTab() {
  const [range, setRange] = useState(defaultRange());
  const [data, setData] = useState<AnalyticsTotal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/whatsapp/analytics?startDate=${range.startDate}&endDate=${range.endDate}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load analytics");
        return;
      }
      setData(json.result?.total || null);
    } catch {
      setError("Network error while loading analytics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface p-5 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Start date</label>
          <input
            type="date"
            value={range.startDate}
            onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))}
            className="h-9 px-3 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">End date</label>
          <input
            type="date"
            value={range.endDate}
            onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))}
            className="h-9 px-3 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-[12.5px] transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-xl">{error}</div>}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {TILES.map((tile) => {
          const raw = data?.[tile.key] ?? 0;
          const value = tile.key === "avgDeliveryTime" ? `${Number(raw).toFixed(1)}s` : Number(raw).toLocaleString();
          return (
            <div key={tile.key} className="bg-white rounded-3xl border border-slate-200 shadow-surface shadow-surface-hover p-5 flex flex-col justify-between min-h-[120px]">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${tile.tint}`}>
                <tile.icon className="h-[18px] w-[18px]" />
              </div>
              <div className="mt-4">
                <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block">{tile.label}</span>
                <span className="text-[24px] font-semibold text-slate-900 tracking-tight tabular-nums block mt-1 leading-none">
                  {loading ? "…" : value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface p-6">
        <h3 className="text-[13.5px] font-semibold text-slate-800 mb-3">By category</h3>
        <div className="grid grid-cols-3 gap-4">
          {(["marketing", "utility", "authentication"] as const).map((cat) => (
            <div key={cat} className="text-center p-4 rounded-2xl bg-slate-50">
              <span className="text-[20px] font-semibold text-slate-900 tabular-nums block">
                {loading ? "…" : Number(data?.[cat] ?? 0).toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide block mt-1 capitalize">{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
