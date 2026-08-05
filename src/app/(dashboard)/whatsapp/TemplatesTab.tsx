"use client";

import React, { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, MessageSquareText } from "lucide-react";
import type { RawWhatsappTemplate } from "./page";
import TemplateFormModal from "./TemplateFormModal";

const STATUS_TINT: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  in_review: "bg-amber-50 text-amber-700",
  rejected: "bg-rose-50 text-rose-700",
  disabled: "bg-slate-100 text-slate-500",
};

export default function TemplatesTab({ initialTemplates }: { initialTemplates: RawWhatsappTemplate[] }) {
  const [templates, setTemplates] = useState<RawWhatsappTemplate[]>(initialTemplates);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busyName, setBusyName] = useState<string | null>(null);
  const [modalTemplate, setModalTemplate] = useState<RawWhatsappTemplate | null | "new">(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.name.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q));
  }, [templates, query]);

  async function refresh() {
    const res = await fetch("/api/whatsapp/templates");
    if (res.ok) {
      const data = await res.json();
      setTemplates(data.templates || []);
    }
  }

  async function handleDelete(tpl: RawWhatsappTemplate) {
    if (!confirm(`Delete template "${tpl.name}"? This removes it from MSG91/WhatsApp and cannot be undone.`)) return;
    setBusyName(tpl.name);
    setError("");
    try {
      const res = await fetch(`/api/whatsapp/templates?template_name=${encodeURIComponent(tpl.name)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to delete template");
        return;
      }
      setTemplates((prev) => prev.filter((t) => t.name !== tpl.name));
    } catch {
      setError("Network error while deleting template");
    } finally {
      setBusyName(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="pl-9 pr-3 py-2 w-full border border-slate-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[12px] text-slate-400">
              {filtered.length} of {templates.length}
            </span>
            <button
              onClick={() => setModalTemplate("new")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-[12.5px] transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" /> New template
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-xl">{error}</div>
        )}

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-slate-400 text-[13px]">
            {templates.length === 0 ? "No WhatsApp templates yet." : `No templates match "${query}".`}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((tpl) => {
              const lang = tpl.languages?.[0];
              const busy = busyName === tpl.name;
              const status = (lang?.status || "unknown").toLowerCase();
              const bodyPreview = lang?.code?.find((c) => c.type === "BODY")?.text || "";
              return (
                <li key={tpl.name} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors group">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 bg-violet-50 text-violet-600">
                    <MessageSquareText className="h-[18px] w-[18px]" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 text-[13.5px] truncate">{tpl.name}</span>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium uppercase">
                        {tpl.category}
                      </span>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium uppercase">
                        {lang?.language}
                      </span>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUS_TINT[status] || "bg-slate-100 text-slate-500"}`}>
                        {status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[12px] truncate mt-0.5">{bodyPreview || "No body content"}</p>
                    {lang?.status?.toLowerCase() === "rejected" && lang?.rejection_reason && lang.rejection_reason !== "NONE" && (
                      <p className="text-rose-500 text-[11.5px] mt-0.5">Rejected: {lang.rejection_reason}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setModalTemplate(tpl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title={status === "approved" || status === "pending" || status === "in_review" ? "Only rejected templates can be edited" : "Edit template"}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(tpl)}
                      disabled={busy}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete template"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {modalTemplate && (
        <TemplateFormModal
          template={modalTemplate === "new" ? null : modalTemplate}
          onClose={() => setModalTemplate(null)}
          onSaved={() => {
            setModalTemplate(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
