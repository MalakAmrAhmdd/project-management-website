"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Users2,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teams", label: "Teams", icon: Users2 },
  { href: "/resources", label: "Resources", icon: Users },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/management", label: "Management", icon: Settings2 },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-surface-900 text-white transition-all duration-300 sticky top-0",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-700">
        <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
          EP
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-semibold text-sm whitespace-nowrap">EBS Project</div>
            <div className="text-xs text-surface-400 whitespace-nowrap">Management</div>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary-600 text-white"
                  : "text-surface-300 hover:bg-surface-800 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-surface-700 hover:bg-surface-800 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
