import React from "react";
import { cookies } from "next/headers";
import WhatsappManager from "./WhatsappManager";

export interface RawWhatsappTemplate {
  category: string;
  name: string;
  namespace: string;
  languages: Array<{
    id: string;
    name: string;
    language: string;
    status: string;
    rejection_reason?: string;
    variables?: string[];
    code: Array<{
      type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
      format?: string;
      text?: string;
      example?: { body_text?: string[][]; header_text?: string[] };
      buttons?: Array<{ type: string; text: string; url?: string; phone_number?: string; example?: string[] }>;
    }>;
  }>;
}

export default async function WhatsappPage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("pratipal_session")?.value;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

  const res = await fetch(`${backendUrl}/api/whatsapp/templates`, {
    headers: { Cookie: `pratipal_session=${sessionCookie}` },
    next: { revalidate: 0 },
    cache: "no-store",
  });

  // Admin-only on the backend — a 403 for editor/viewer roles is expected,
  // not a failure. Let the client component's role check render the
  // "admin access required" state instead of throwing an error boundary.
  const templates: RawWhatsappTemplate[] = res.ok ? (await res.json()).templates || [] : [];
  const forbidden = res.status === 403;

  return (
    <div className="space-y-5 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white py-4 px-5 rounded-3xl border border-slate-200 shadow-surface gap-4">
        <div>
          <h1 className="text-[15px] font-semibold text-slate-900">WhatsApp</h1>
          <p className="text-slate-500 text-[12.5px] mt-0.5">
            Manage MSG91 templates, send session messages, and review delivery analytics.
          </p>
        </div>
      </div>

      <WhatsappManager initialTemplates={templates} forbidden={forbidden} />
    </div>
  );
}
