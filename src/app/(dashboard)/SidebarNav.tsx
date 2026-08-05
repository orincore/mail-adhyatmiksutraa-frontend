"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Send,
  LayoutTemplate,
  Video,
  Filter,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";
import { WhatsAppIcon } from "@/lib/brand-icons";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Subscribers", href: "/subscribers", icon: Users },
  { label: "Segments", href: "/segments", icon: Filter },
  { label: "Campaigns", href: "/campaigns", icon: Send },
  { label: "Templates", href: "/templates", icon: LayoutTemplate },
  { label: "WhatsApp", href: "/whatsapp", icon: WhatsAppIcon },
  { label: "Reminders", href: "/webinars", icon: Video },
  { label: "Suppressions", href: "/suppressions", icon: ShieldOff },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 w-full px-3">
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex items-center w-full"
          >
            {/* Active indicator bar */}
            <span
              className={`absolute -left-3 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-violet-600 transition-all duration-200 ${
                isActive ? "opacity-100 scale-100" : "opacity-0 scale-50"
              }`}
            />
            <span
              className={`flex items-center gap-3 w-full h-10 px-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? "bg-violet-50 text-violet-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={isActive ? 2.25 : 2} />
              <span className={`text-[13px] leading-none truncate ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
