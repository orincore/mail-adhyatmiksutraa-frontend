"use client";

import React, { useState } from "react";
import { LayoutTemplate, Send, BarChart3, ScrollText, ShieldAlert } from "lucide-react";
import { useRole } from "../RoleProvider";
import type { RawWhatsappTemplate } from "./page";
import TemplatesTab from "./TemplatesTab";
import SendMessageTab from "./SendMessageTab";
import AnalyticsTab from "./AnalyticsTab";
import LogsTab from "./LogsTab";

type Tab = "templates" | "send" | "analytics" | "logs";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "send", label: "Send message", icon: Send },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "logs", label: "Logs", icon: ScrollText },
];

export default function WhatsappManager({
  initialTemplates,
  forbidden,
}: {
  initialTemplates: RawWhatsappTemplate[];
  forbidden: boolean;
}) {
  const { isAdmin } = useRole();
  const [tab, setTab] = useState<Tab>("templates");

  if (!isAdmin || forbidden) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center gap-3">
        <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div>
          <h3 className="font-semibold text-slate-800 text-[14px]">Admin access required</h3>
          <p className="text-slate-400 text-[13px] mt-1 max-w-sm">
            Template management, sending, and account analytics touch the shared MSG91/WhatsApp account —
            only admins can access this section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface p-1.5 flex items-center gap-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-[12.5px] font-medium transition-colors cursor-pointer ${
              tab === t.id ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "templates" && <TemplatesTab initialTemplates={initialTemplates} />}
      {tab === "send" && <SendMessageTab />}
      {tab === "analytics" && <AnalyticsTab />}
      {tab === "logs" && <LogsTab />}
    </div>
  );
}
