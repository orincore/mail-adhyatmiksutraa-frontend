"use client";

import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

interface LogRow {
  requestedAt: string;
  status: string;
  customerNumber: string;
  templateName?: string;
  messageType?: string;
  content?: string;
  failureReason?: string | null;
}

function defaultRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

const STATUS_TINT: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-700",
  read: "bg-teal-50 text-teal-700",
  sent: "bg-sky-50 text-sky-700",
  submitted: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
};

function contentPreview(row: LogRow): string {
  if (row.templateName) return `Template: ${row.templateName}`;
  try {
    const parsed = JSON.parse(row.content || "{}");
    return parsed.text || "(no text)";
  } catch {
    return row.content || "";
  }
}

export default function LogsTab() {
  const [range, setRange] = useState(defaultRange());
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/whatsapp/logs?startDate=${range.startDate}&endDate=${range.endDate}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load logs");
        return;
      }
      setRows(json.result?.data || []);
    } catch {
      setError("Network error while loading logs");
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
        <span className="text-[12px] text-slate-400 ml-auto">{rows.length} messages</span>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-xl">{error}</div>}

      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface overflow-hidden">
        {loading ? (
          <div className="py-14 text-center text-slate-400 text-[13px]">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-[13px]">No messages in this date range.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Time</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Recipient</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-[11px] font-medium text-slate-500 uppercase tracking-wide">Content</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => {
                  const status = (row.status || "").toLowerCase();
                  return (
                    <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 text-[12.5px] text-slate-500 whitespace-nowrap">{row.requestedAt}</td>
                      <td className="px-5 py-3 text-[12.5px] text-slate-700 font-medium whitespace-nowrap">{row.customerNumber}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10.5px] font-medium capitalize ${STATUS_TINT[status] || "bg-slate-100 text-slate-500"}`}>
                          {row.status}
                        </span>
                        {row.failureReason && (
                          <p className="text-rose-500 text-[11px] mt-1">{row.failureReason}</p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-[12.5px] text-slate-500 max-w-md truncate">{contentPreview(row)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
