"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  ShieldOff,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  XCircle,
  MailWarning,
  UserMinus,
  Mail,
} from "lucide-react";
import { WhatsAppIcon } from "@/lib/brand-icons";
import { useRole } from "../RoleProvider";

interface Suppression {
  id?: string;
  _id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  status: string;
  updated_at: string;
  last_event?: {
    event_type: string;
    timestamp: string;
    details?: { error?: string; bounceType?: string; bounceSubType?: string };
  } | null;
}

interface WhatsappSuppression {
  id?: string;
  _id?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  whatsapp_number?: string;
  whatsapp_opted_out_at?: string;
}

type Channel = "email" | "whatsapp";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "bounced", label: "Bounced" },
  { value: "complained", label: "Complained" },
];

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  unsubscribed: UserMinus,
  bounced: XCircle,
  complained: MailWarning,
};

export default function SuppressionsPage() {
  const { canWrite } = useRole();
  const [channel, setChannel] = useState<Channel>("email");
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setNotification({ text, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- Email suppressions ---
  const [items, setItems] = useState<Suppression[]>([]);
  const [counts, setCounts] = useState<{ bounced: number; complained: number; unsubscribed: number }>({ bounced: 0, complained: 0, unsubscribed: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchSuppressions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/subscribers/suppressions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.subscribers || []);
        setCounts(data.counts || { bounced: 0, complained: 0, unsubscribed: 0 });
        setTotalPages(data.pages || 1);
        setTotal(data.total || 0);
      }
    } catch {
      showNotification("Failed to load suppressions", "error");
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    if (channel === "email") fetchSuppressions();
  }, [channel, fetchSuppressions]);

  const handleReactivate = async (item: Suppression) => {
    const id = item.id || item._id!;
    setBusyId(id);
    try {
      const res = await fetch("/api/subscribers/suppressions/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(`${item.email} reactivated`);
        setItems((prev) => prev.filter((i) => (i.id || i._id) !== id));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        showNotification(data.error || "Failed to reactivate", "error");
      }
    } catch {
      showNotification("Network error", "error");
    } finally {
      setBusyId(null);
    }
  };

  // --- WhatsApp opt-outs ---
  const [waItems, setWaItems] = useState<WhatsappSuppression[]>([]);
  const [waLoading, setWaLoading] = useState(true);
  const [waPage, setWaPage] = useState(1);
  const [waTotalPages, setWaTotalPages] = useState(1);
  const [waTotal, setWaTotal] = useState(0);
  const [waBusyId, setWaBusyId] = useState<string | null>(null);

  const fetchWhatsappSuppressions = useCallback(async () => {
    setWaLoading(true);
    try {
      const params = new URLSearchParams({ page: String(waPage), limit: "25" });
      const res = await fetch(`/api/subscribers/whatsapp-suppressions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWaItems(data.subscribers || []);
        setWaTotalPages(data.pages || 1);
        setWaTotal(data.total || 0);
      }
    } catch {
      showNotification("Failed to load WhatsApp opt-outs", "error");
    } finally {
      setWaLoading(false);
    }
  }, [waPage]);

  useEffect(() => {
    if (channel === "whatsapp") fetchWhatsappSuppressions();
  }, [channel, fetchWhatsappSuppressions]);

  const handleWhatsappReactivate = async (item: WhatsappSuppression) => {
    const id = item.id || item._id!;
    setWaBusyId(id);
    try {
      const res = await fetch("/api/subscribers/whatsapp-suppressions/reactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (res.ok) {
        const who = item.whatsapp_number || item.email;
        showNotification(
          data.notified
            ? `${who} re-opted into WhatsApp — confirmation message sent`
            : `${who} re-opted into WhatsApp, but the confirmation message couldn't be sent${data.notifyError ? ` (${data.notifyError})` : ""}`,
          data.notified ? "success" : "error"
        );
        setWaItems((prev) => prev.filter((i) => (i.id || i._id) !== id));
        setWaTotal((t) => Math.max(0, t - 1));
      } else {
        showNotification(data.error || "Failed to reactivate", "error");
      }
    } catch {
      showNotification("Network error", "error");
    } finally {
      setWaBusyId(null);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {notification && (
        <div className={`fixed bottom-4 right-4 z-[9999] p-4 rounded-xl shadow-lg border text-sm flex items-center gap-2 animate-bounce ${
          notification.type === "success" ? "bg-violet-50 text-violet-800 border-violet-200" : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {notification.type === "success" ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Suppression List</h1>
          <p className="text-slate-500 text-sm mt-1">
            Recipients excluded from future sends.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setChannel("email")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              channel === "email" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Mail className="h-3.5 w-3.5" /> Email
          </button>
          <button
            onClick={() => setChannel("whatsapp")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              channel === "whatsapp" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
          </button>
        </div>
      </div>

      {channel === "email" ? (
        <>
          {/* Status count cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["unsubscribed", "bounced", "complained"] as const).map((s) => {
              const Icon = STATUS_ICON[s];
              return (
                <div key={s} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-full">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s}</span>
                    <span className="text-xl font-black text-slate-900">{counts[s].toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex-wrap">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatus(tab.value);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === tab.value
                      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                      : "bg-white text-slate-600 border-slate-200 hover:border-violet-400 hover:text-violet-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : items.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                  <ShieldOff className="h-10 w-10" />
                </div>
                <p className="text-slate-400 text-sm">No suppressed contacts in this category.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">Contact</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4">Since</th>
                      {canWrite && <th className="py-3 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {items.map((item) => {
                      const id = item.id || item._id!;
                      let reason = "—";
                      if (item.last_event) {
                        if (item.last_event.event_type === "complaint") reason = "Reported as spam";
                        else if (item.last_event.details?.bounceType) reason = `${item.last_event.details.bounceType} bounce`;
                        else if (item.last_event.details?.error) reason = item.last_event.details.error;
                        else if (item.last_event.event_type === "unsubscribe") reason = "Manually unsubscribed";
                      }
                      return (
                        <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">
                              {item.first_name ? `${item.first_name} ${item.last_name || ""}` : "—"}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">{item.email}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-100">
                              {item.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 max-w-xs truncate">{reason}</td>
                          <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                            {new Date(item.updated_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </td>
                          {canWrite && (
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleReactivate(item)}
                                disabled={busyId === id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-[10px] text-slate-400 font-semibold">
                  Page {page} of {totalPages} &middot; {total.toLocaleString()} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 border border-slate-200 hover:bg-white bg-white rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 border border-slate-200 hover:bg-white bg-white rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-full">
                <WhatsAppIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Opted out</span>
                <span className="text-xl font-black text-slate-900">{waTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Replied <span className="font-mono font-semibold">STOP</span> to a WhatsApp message — excluded from
                all future campaign, reminder, and transactional WhatsApp sends.
              </p>
            </div>

            {waLoading ? (
              <div className="py-20 text-center">
                <div className="h-8 w-8 border-4 border-slate-200 border-t-violet-600 rounded-full animate-spin mx-auto" />
              </div>
            ) : waItems.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-3">
                <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                  <WhatsAppIcon className="h-9 w-9" />
                </div>
                <p className="text-slate-400 text-sm">No WhatsApp opt-outs yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-6">Contact</th>
                      <th className="py-3 px-4">WhatsApp number</th>
                      <th className="py-3 px-4">Opted out</th>
                      {canWrite && <th className="py-3 px-6 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {waItems.map((item) => {
                      const id = item.id || item._id!;
                      return (
                        <tr key={id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-4 px-6">
                            <div className="font-semibold text-slate-800">
                              {item.first_name ? `${item.first_name} ${item.last_name || ""}` : "—"}
                            </div>
                            <div className="text-slate-400 text-xs mt-0.5">{item.email || "—"}</div>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-600 font-mono">{item.whatsapp_number || "—"}</td>
                          <td className="py-4 px-4 text-xs text-slate-400 font-mono">
                            {item.whatsapp_opted_out_at
                              ? new Date(item.whatsapp_opted_out_at).toLocaleDateString("en-IN", { dateStyle: "medium" })
                              : "—"}
                          </td>
                          {canWrite && (
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handleWhatsappReactivate(item)}
                                disabled={waBusyId === id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Reactivate
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {!waLoading && waTotalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-[10px] text-slate-400 font-semibold">
                  Page {waPage} of {waTotalPages} &middot; {waTotal.toLocaleString()} total
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWaPage((p) => Math.max(1, p - 1))}
                    disabled={waPage <= 1}
                    className="p-2 border border-slate-200 hover:bg-white bg-white rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setWaPage((p) => Math.min(waTotalPages, p + 1))}
                    disabled={waPage >= waTotalPages}
                    className="p-2 border border-slate-200 hover:bg-white bg-white rounded-lg text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
