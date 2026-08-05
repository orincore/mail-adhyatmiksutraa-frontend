"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Bell,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  CalendarClock,
  Search,
} from "lucide-react";

interface WebinarReminderSummary {
  id: string;
  dispatch_status: "pending" | "sending" | "sent" | "skipped";
  whatsapp_dispatch_status?: "pending" | "sending" | "sent" | "skipped";
}

interface WebinarListItem {
  id: string;
  title: string;
  slug: string;
  starts_at: string;
  timezone: string;
  status: "upcoming" | "completed" | "cancelled";
  registrant_count: number;
  reminders: WebinarReminderSummary[];
  registration_start?: string;
  registration_end?: string;
  updated_at?: string;
  created_at?: string;
}

type StatusFilter = "all" | "upcoming" | "completed" | "cancelled";

const STATUS_TINT: Record<string, string> = {
  upcoming: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  completed: "bg-slate-100 text-slate-600 border-slate-200",
};

function formatInZone(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleString();
  }
}

function formatShort(iso: string, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone, dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return new Date(iso).toLocaleDateString();
  }
}

function sortKey(w: WebinarListItem): number {
  const t = new Date(w.updated_at || w.created_at || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function WebinarsListPage() {
  const [webinars, setWebinars] = useState<WebinarListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [notification, setNotification] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadWebinars() {
    try {
      const res = await fetch("/api/webinars");
      if (!res.ok) throw new Error("Failed to load webinars");
      const data = await res.json();
      // Backend already returns updated_at-descending, but sort defensively
      // client-side too so "most recently created/updated first" holds
      // regardless of API ordering.
      const list: WebinarListItem[] = data.webinars ?? [];
      list.sort((a, b) => sortKey(b) - sortKey(a));
      setWebinars(list);
    } catch (err: any) {
      showNotification(err.message || "Failed to load webinars", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWebinars();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return webinars.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      if (!q) return true;
      return w.title.toLowerCase().includes(q) || w.slug.toLowerCase().includes(q);
    });
  }, [webinars, query, statusFilter]);

  return (
    <div className="space-y-5 text-left">
      {notification && (
        <div
          className={`fixed bottom-4 right-4 z-[9999] p-4 rounded-xl shadow-lg border text-sm flex items-center gap-2 ${
            notification.type === "success"
              ? "bg-violet-50 text-violet-800 border-violet-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {notification.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white py-4 px-5 rounded-3xl border border-slate-200 shadow-surface gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">Reminders</h1>
          <p className="text-slate-500 text-[12.5px] mt-0.5">
            Synced automatically from registration windows on the main website.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100 flex-wrap">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reminders…"
              className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-9 px-3 text-[12.5px] border border-slate-200 rounded-full bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 text-slate-700"
            >
              <option value="all">All statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <span className="text-[12px] text-slate-400">
              {filtered.length} of {webinars.length}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <div className="h-6 w-6 border-2 border-slate-200 border-t-violet-600 rounded-full animate-spin" />
          </div>
        ) : webinars.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center gap-3 px-6">
            <div className="p-4 bg-violet-50 rounded-2xl text-violet-500">
              <Bell className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-[14px]">No reminders yet</h3>
              <p className="text-slate-400 text-[13px] mt-1 max-w-sm">
                Registration windows sync automatically from the main website — flag a landing page as a
                webinar (with a start date) there and it will appear here shortly.
              </p>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-[13px]">
            {query ? `No reminders match "${query}".` : "No reminders match this filter."}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((w) => {
              const sentCount = w.reminders.filter(
                (r) => r.dispatch_status === "sent" || r.whatsapp_dispatch_status === "sent"
              ).length;
              return (
                <li key={w.id}>
                  <Link
                    href={`/webinars/${w.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                      <Bell className="h-[18px] w-[18px]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-800 text-[13.5px] truncate">{w.title}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase tracking-wider ${STATUS_TINT[w.status]}`}>
                          {w.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[12px] truncate mt-0.5">{formatInZone(w.starts_at, w.timezone)}</p>
                      {w.registration_start && w.registration_end && (
                        <p className="text-slate-400 text-[11.5px] flex items-center gap-1 mt-0.5 truncate">
                          <CalendarClock className="h-3 w-3 flex-shrink-0" />
                          Registration: {formatShort(w.registration_start, w.timezone)} → {formatShort(w.registration_end, w.timezone)}
                        </p>
                      )}
                    </div>

                    <div className="hidden sm:flex items-center gap-4 text-[12px] text-slate-500 shrink-0">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {w.registrant_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bell className="h-3.5 w-3.5" /> {sentCount}/{w.reminders.length}
                      </span>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
