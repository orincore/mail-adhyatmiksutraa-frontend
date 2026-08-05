"use client";

import React, { useMemo, useState } from "react";
import { X, MessageSquareText, Plus, Trash2, Loader2 } from "lucide-react";
import type { RawWhatsappTemplate } from "./page";
import WhatsAppPreview from "./WhatsAppPreview";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "bn", label: "Bengali" },
  { code: "pa", label: "Punjabi" },
];

const CATEGORIES = ["UTILITY", "MARKETING", "AUTHENTICATION"];

interface ButtonRow {
  type: "QUICK_REPLY" | "URL";
  text: string;
  url?: string;
  example?: string;
}

interface OutgoingComponent {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT";
  text?: string;
  example?: { body_text?: string[][]; header_text?: string[] };
  buttons?: Array<{ type: "QUICK_REPLY" | "URL"; text: string; url?: string; example?: string[] }>;
}

/** Counts distinct {{n}} placeholders in template text. */
function variableCount(text: string): number {
  const matches = [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => parseInt(m[1], 10));
  return matches.length ? Math.max(...matches) : 0;
}

function buildComponentsFromForm(form: {
  headerText: string;
  bodyText: string;
  bodyExamples: string[];
  footerText: string;
  buttons: ButtonRow[];
}) {
  const components: OutgoingComponent[] = [];

  if (form.headerText.trim()) {
    components.push({ type: "HEADER", format: "TEXT", text: form.headerText.trim() });
  }

  const bodyVarCount = variableCount(form.bodyText);
  const bodyComponent: OutgoingComponent = { type: "BODY", text: form.bodyText.trim() };
  if (bodyVarCount > 0) {
    bodyComponent.example = { body_text: [form.bodyExamples.slice(0, bodyVarCount).map((v) => v || "sample")] };
  }
  components.push(bodyComponent);

  if (form.footerText.trim()) {
    components.push({ type: "FOOTER", text: form.footerText.trim() });
  }

  const validButtons = form.buttons.filter((b) => b.text.trim());
  if (validButtons.length > 0) {
    components.push({
      type: "BUTTONS",
      buttons: validButtons.map((b) => {
        if (b.type === "URL") {
          const hasVar = variableCount(b.url || "") > 0;
          return {
            type: "URL",
            text: b.text.trim(),
            url: (b.url || "").trim(),
            ...(hasVar ? { example: [b.example || "sample"] } : {}),
          };
        }
        return { type: "QUICK_REPLY", text: b.text.trim() };
      }),
    });
  }

  const buttonUrl = validButtons.some((b) => b.type === "URL");
  return { components, buttonUrl };
}

export default function TemplateFormModal({
  template,
  onClose,
  onSaved,
}: {
  template: RawWhatsappTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!template;
  const lang = template?.languages?.[0];
  const editable = !isEdit || (lang?.status || "").toLowerCase() === "rejected";

  const existingHeader = lang?.code?.find((c) => c.type === "HEADER");
  const existingBody = lang?.code?.find((c) => c.type === "BODY");
  const existingFooter = lang?.code?.find((c) => c.type === "FOOTER");
  const existingButtons = lang?.code?.find((c) => c.type === "BUTTONS");

  const [templateName, setTemplateName] = useState(template?.name || "");
  const [language, setLanguage] = useState(lang?.language || "en");
  const [category, setCategory] = useState(template?.category || "UTILITY");
  const [headerText, setHeaderText] = useState(existingHeader?.text || "");
  const [bodyText, setBodyText] = useState(existingBody?.text || "");
  const [bodyExamples, setBodyExamples] = useState<string[]>(existingBody?.example?.body_text?.[0] || []);
  const [footerText, setFooterText] = useState(existingFooter?.text || "");
  const [buttons, setButtons] = useState<ButtonRow[]>(
    (existingButtons?.buttons || []).map((b) => ({
      type: b.type as ButtonRow["type"],
      text: b.text || "",
      url: b.url || "",
      example: b.example?.[0] || "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const bodyVarCount = useMemo(() => variableCount(bodyText), [bodyText]);

  function updateBodyExample(i: number, value: string) {
    setBodyExamples((prev) => {
      const next = [...prev];
      next[i] = value;
      return next;
    });
  }

  function addButton() {
    setButtons((prev) => [...prev, { type: "QUICK_REPLY", text: "" }]);
  }

  function updateButton(i: number, patch: Partial<ButtonRow>) {
    setButtons((prev) => prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }

  function removeButton(i: number) {
    setButtons((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!templateName.trim() || !bodyText.trim()) {
      setError("Template name and body text are required.");
      return;
    }
    if (bodyVarCount > 0 && bodyExamples.slice(0, bodyVarCount).some((v) => !v?.trim())) {
      setError(`Provide a sample value for each of the ${bodyVarCount} body variable(s).`);
      return;
    }

    const { components, buttonUrl } = buildComponentsFromForm({ headerText, bodyText, bodyExamples, footerText, buttons });

    setSaving(true);
    try {
      const res = isEdit
        ? await fetch(`/api/whatsapp/templates/${encodeURIComponent(lang!.id)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ components, button_url: buttonUrl }),
          })
        : await fetch(`/api/whatsapp/templates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              template_name: templateName.trim(),
              language,
              category,
              components,
              button_url: buttonUrl,
            }),
          });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Failed to ${isEdit ? "update" : "create"} template`);
        return;
      }
      onSaved();
    } catch {
      setError("Network error while saving template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end animate-fade-in">
      <div className="bg-white max-w-5xl w-full h-full border-l border-slate-100 shadow-2xl flex flex-col animate-slide-in">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-violet-600" />
            <div>
              <h2 className="text-lg font-bold text-slate-800">{isEdit ? "Edit template" : "New WhatsApp template"}</h2>
              <p className="text-slate-400 text-xs">
                {isEdit ? template!.name : "Submitted to Meta for review on save"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
        <form onSubmit={handleSubmit} className="flex-1 min-w-0 p-6 space-y-5">
          {!editable && (
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 text-[12.5px] rounded-xl">
              This template is <strong>{lang?.status}</strong> — MSG91 only allows edits on rejected templates.
              Delete and recreate it instead.
            </div>
          )}
          {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-[13px] rounded-xl">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5 col-span-2">
              <label className="text-[12.5px] font-medium text-slate-700">Template name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                disabled={isEdit}
                placeholder="e.g. order_confirmed_customer"
                className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <p className="text-[11px] text-slate-400">Lowercase letters, numbers, underscores only. Can&apos;t be changed after creation.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-slate-700">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={isEdit}
                className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[12.5px] font-medium text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isEdit}
                className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50 disabled:text-slate-400"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-slate-700">Header <span className="text-slate-400 font-normal">(optional, static text only)</span></label>
            <input
              type="text"
              value={headerText}
              onChange={(e) => setHeaderText(e.target.value)}
              placeholder="e.g. Order Confirmed"
              disabled={!editable}
              className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-slate-700">Body</label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={4}
              placeholder={"Hi {{1}}, your order {{2}} has shipped!"}
              disabled={!editable}
              className="w-full px-3.5 py-2.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50 resize-none"
            />
            <p className="text-[11px] text-slate-400">Use {"{{1}}"}, {"{{2}}"}, etc. for variables.</p>

            {bodyVarCount > 0 && (
              <div className="grid grid-cols-2 gap-2.5 pt-1.5">
                {Array.from({ length: bodyVarCount }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    value={bodyExamples[i] || ""}
                    onChange={(e) => updateBodyExample(i, e.target.value)}
                    placeholder={`Sample value for {{${i + 1}}}`}
                    disabled={!editable}
                    className="h-9 px-3 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[12.5px] font-medium text-slate-700">Footer <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder="e.g. Reply STOP to unsubscribe"
              disabled={!editable}
              className="w-full h-10 px-3.5 text-[13px] border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/15 focus:border-violet-400 disabled:bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[12.5px] font-medium text-slate-700">Buttons <span className="text-slate-400 font-normal">(optional, up to 3)</span></label>
              {editable && buttons.length < 3 && (
                <button type="button" onClick={addButton} className="inline-flex items-center gap-1 text-[12px] font-medium text-violet-600 hover:text-violet-700 cursor-pointer">
                  <Plus className="h-3.5 w-3.5" /> Add button
                </button>
              )}
            </div>

            {buttons.map((b, i) => (
              <div key={i} className="flex items-start gap-2 p-3 border border-slate-200 rounded-xl bg-slate-50/60">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      value={b.type}
                      onChange={(e) => updateButton(i, { type: e.target.value as ButtonRow["type"] })}
                      disabled={!editable}
                      className="h-8 px-2 text-[12px] border border-slate-200 rounded-lg bg-white focus:outline-none"
                    >
                      <option value="QUICK_REPLY">Quick reply</option>
                      <option value="URL">URL</option>
                    </select>
                    <input
                      type="text"
                      value={b.text}
                      onChange={(e) => updateButton(i, { text: e.target.value })}
                      placeholder="Button label"
                      disabled={!editable}
                      className="flex-1 h-8 px-2.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none"
                    />
                  </div>
                  {b.type === "URL" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={b.url || ""}
                        onChange={(e) => updateButton(i, { url: e.target.value })}
                        placeholder="https://example.com/{{1}}"
                        disabled={!editable}
                        className="flex-1 h-8 px-2.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none"
                      />
                      {variableCount(b.url || "") > 0 && (
                        <input
                          type="text"
                          value={b.example || ""}
                          onChange={(e) => updateButton(i, { example: e.target.value })}
                          placeholder="Sample suffix"
                          disabled={!editable}
                          className="w-32 h-8 px-2.5 text-[12.5px] border border-slate-200 rounded-lg bg-white focus:outline-none"
                        />
                      )}
                    </div>
                  )}
                </div>
                {editable && (
                  <button type="button" onClick={() => removeButton(i)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full cursor-pointer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </form>

        <div className="w-full lg:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 bg-slate-50 p-6 flex flex-col items-center">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide self-start mb-4">Message preview</p>
          <WhatsAppPreview
            headerText={headerText}
            bodyText={bodyText}
            bodyExamples={bodyExamples}
            footerText={footerText}
            buttons={buttons}
          />
        </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || !editable}
            className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-full text-[13px] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEdit ? "Save changes" : "Create template"}
          </button>
        </div>
      </div>
    </div>
  );
}
