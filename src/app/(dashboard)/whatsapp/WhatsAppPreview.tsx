"use client";

import React from "react";
import { ChevronLeft, Video, Phone, MoreVertical, ExternalLink, CornerUpLeft, Check } from "lucide-react";
import { BRAND_NAME } from "@/lib/branding";

// Verified against WhatsApp's documented UI palette (schemecolor.com /
// colorswall.com "WhatsApp colors" — #25D366, #075E54, #128C7E, #DCF8C6,
// #ECE5DD "Flour", #34B7F1 "Spring Sky") rather than guessed, since this is
// meant to be an accurate stand-in for the real app, not just green-ish.
const WA = {
  headerGreen: "#075E54",
  bubbleGreen: "#DCF8C6",
  wallpaper: "#ECE5DD",
  linkBlue: "#34B7F1",
  metaGray: "#667781",
  textDark: "#111B21",
};

export interface PreviewButton {
  type: "QUICK_REPLY" | "URL";
  text: string;
}

/** Replaces {{n}} with its example value (or an obvious bracketed placeholder while unfilled). */
function substituteVariables(text: string, examples: string[]): string {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
    const val = examples[parseInt(n, 10) - 1];
    return val && val.trim() ? val.trim() : `[Sample ${n}]`;
  });
}

/** Renders WhatsApp's inline markup (bold, italic, strikethrough) and preserves line breaks. */
function renderWhatsappMarkup(text: string): React.ReactNode {
  return text.split("\n").map((line, li, arr) => (
    <React.Fragment key={li}>
      {renderInline(line)}
      {li < arr.length - 1 && <br />}
    </React.Fragment>
  ));
}

function renderInline(line: string): React.ReactNode[] {
  const regex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(line))) {
    if (match.index > lastIndex) out.push(line.slice(lastIndex, match.index));
    const token = match[0];
    const inner = token.slice(1, -1);
    if (token.startsWith("*")) out.push(<strong key={key++} className="font-semibold">{inner}</strong>);
    else if (token.startsWith("_")) out.push(<em key={key++}>{inner}</em>);
    else out.push(<span key={key++} style={{ textDecoration: "line-through" }}>{inner}</span>);
    lastIndex = match.index + token.length;
  }
  if (lastIndex < line.length) out.push(line.slice(lastIndex));
  return out;
}

export default function WhatsAppPreview({
  headerText,
  bodyText,
  bodyExamples,
  footerText,
  buttons,
}: {
  headerText: string;
  bodyText: string;
  bodyExamples: string[];
  footerText: string;
  buttons: PreviewButton[];
}) {
  const now = new Date();
  const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const clockLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });

  const renderedBody = substituteVariables(bodyText || "Your message will appear here.", bodyExamples);
  const validButtons = buttons.filter((b) => b.text.trim());

  return (
    <div className="w-full max-w-[300px] mx-auto select-none">
      {/* Phone frame */}
      <div className="rounded-[2rem] bg-slate-900 p-2 shadow-xl">
        <div className="rounded-[1.6rem] overflow-hidden bg-white">
          {/* Status bar */}
          <div style={{ backgroundColor: WA.headerGreen }} className="h-6 flex items-center justify-between px-4">
            <span className="text-white text-[10px] font-medium tabular-nums">{clockLabel}</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-2 border border-white/80 rounded-[1px] relative">
                <div className="absolute inset-[1px] bg-white/80" style={{ width: "70%" }} />
              </div>
            </div>
          </div>

          {/* WhatsApp chat header */}
          <div style={{ backgroundColor: WA.headerGreen }} className="px-2.5 py-2 flex items-center gap-2">
            <ChevronLeft className="h-5 w-5 text-white shrink-0" />
            <div className="w-8 h-8 rounded-full bg-white/25 overflow-hidden flex items-center justify-center shrink-0 text-white text-[12px] font-semibold">
              {BRAND_NAME.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[13px] font-medium truncate leading-tight">{BRAND_NAME}</p>
              <p className="text-white/70 text-[10px] leading-tight">Business Account</p>
            </div>
            <Video className="h-4 w-4 text-white shrink-0" />
            <Phone className="h-3.5 w-3.5 text-white shrink-0" />
            <MoreVertical className="h-4 w-4 text-white shrink-0" />
          </div>

          {/* Chat area */}
          <div
            className="px-2.5 py-4 min-h-[300px] flex flex-col justify-end"
            style={{
              backgroundColor: WA.wallpaper,
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.045) 1px, transparent 0)",
              backgroundSize: "14px 14px",
            }}
          >
            <div className="flex justify-end">
              <div className="max-w-[88%] relative">
                {/* Bubble tail */}
                <div
                  className="absolute -right-[7px] top-0 w-0 h-0"
                  style={{
                    borderTop: `8px solid ${WA.bubbleGreen}`,
                    borderLeft: "8px solid transparent",
                  }}
                />

                <div className="rounded-lg rounded-tr-none overflow-hidden shadow-sm">
                  <div style={{ backgroundColor: WA.bubbleGreen }} className="px-2.5 py-1.5">
                    {headerText.trim() && (
                      <p className="font-bold text-[13.5px] mb-0.5 leading-snug" style={{ color: WA.textDark }}>
                        {headerText}
                      </p>
                    )}
                    <p className="text-[13.5px] leading-snug whitespace-pre-wrap break-words" style={{ color: WA.textDark }}>
                      {renderWhatsappMarkup(renderedBody)}
                    </p>
                    {footerText.trim() && (
                      <p className="text-[12px] mt-1 leading-snug" style={{ color: WA.metaGray }}>
                        {footerText}
                      </p>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <span className="text-[10px]" style={{ color: WA.metaGray }}>{timeLabel}</span>
                      <span className="flex items-center -space-x-1.5">
                        <Check className="h-3 w-3" style={{ color: WA.linkBlue }} strokeWidth={3} />
                        <Check className="h-3 w-3" style={{ color: WA.linkBlue }} strokeWidth={3} />
                      </span>
                    </div>
                  </div>

                  {validButtons.length > 0 && (
                    <div className="bg-white">
                      {validButtons.map((b, i) => (
                        <div
                          key={i}
                          className={`flex items-center justify-center gap-1.5 py-2 text-[13px] font-medium ${i > 0 ? "border-t border-black/[0.06]" : "border-t border-black/[0.06]"}`}
                          style={{ color: WA.linkBlue }}
                        >
                          {b.type === "URL" ? <ExternalLink className="h-3.5 w-3.5" /> : <CornerUpLeft className="h-3.5 w-3.5" />}
                          <span className="truncate max-w-[220px]">{b.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="text-center text-[11px] text-slate-400 mt-3">Live preview — approximates the WhatsApp app</p>
    </div>
  );
}
