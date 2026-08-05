"use client";

import React, { useState } from "react";
import { Send, Loader2, CheckCircle2, Info } from "lucide-react";

export default function SendMessageTab() {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ message_uuid?: string; message?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);

    if (!to.trim() || !text.trim()) {
      setError("Recipient number and message text are required.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/whatsapp/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), content_type: "text", text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to send message");
        return;
      }
      setResult(data.result?.data || data.result);
      setText("");
    } catch {
      setError("Network error while sending message");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-surface p-6 space-y-4">
        <div>
          <h2 className="text-[14px] font-semibold text-slate-900">Send session message</h2>
          <p className="text-slate-400 text-[12.5px] mt-0.5">
            Free-form text — only delivers inside an active 24h customer-service window.
          </p>
        </div>

        {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-xl">{error}</div>}
        {result && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] rounded-xl flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Accepted by MSG91</p>
              <p className="text-[12px] mt-0.5">{result.message || "Message request submitted."}</p>
              {result.message_uuid && <p className="text-[11px] mt-1 text-emerald-600/80 font-mono">{result.message_uuid}</p>}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-700">Recipient number</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="919876543210"
            className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[12.5px] font-medium text-slate-700">Message</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Type your message…"
            className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send message
        </button>
      </form>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-surface p-6 h-fit">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <h3 className="text-[13.5px] font-semibold text-slate-800">About the 24h session window</h3>
        </div>
        <p className="text-[12.5px] text-slate-500 leading-relaxed">
          WhatsApp only allows free-form messages to someone who has messaged your integrated number within the
          last 24 hours. Outside that window, Meta rejects the send regardless of content — use a
          Meta-approved template instead (see the Templates tab) to reach someone who hasn&apos;t messaged you recently.
        </p>
      </div>
    </div>
  );
}
