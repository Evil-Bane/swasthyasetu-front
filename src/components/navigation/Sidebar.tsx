"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Activity, AlertTriangle,
    Pill, Building2, TrendingUp, FileText
} from "lucide-react";

const NAV = [
    { href: "/dashboard", label: "Command Center", icon: LayoutDashboard, color: "#06b6d4" },
    { href: "/dashboard/patients", label: "Patients", icon: Users, color: "#3b82f6" },
    { href: "/dashboard/vitals", label: "Vitals Monitor", icon: Activity, color: "#10b981" },
    { href: "/dashboard/alerts", label: "Alerts", icon: AlertTriangle, color: "#f97316" },
    { href: "/dashboard/medications", label: "Medications", icon: Pill, color: "#a855f7" },
    { href: "/dashboard/hospital", label: "Hospital", icon: Building2, color: "#8b5cf6" },
    { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp, color: "#14b8a6" },
    { href: "/dashboard/reports", label: "Reports", icon: FileText, color: "#f59e0b" },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <nav className="fixed left-0 top-0 bottom-0 w-[220px] z-50 flex flex-col">
            {/* Sidebar background with glass effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0c1020]/90 via-[#0a0e1a]/95 to-[#0d0818]/90 backdrop-blur-2xl border-r border-white/[0.06]" />

            {/* Ambient glow at top */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-cyan-500/[0.04] to-transparent pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Logo */}
                <div className="px-5 pt-6 pb-8">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all duration-300 group-hover:scale-105">
                            <span className="text-sm font-bold text-white">S</span>
                        </div>
                        <div>
                            <span className="text-sm font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent font-display">
                                SwasthyaSetu
                            </span>
                            <p className="text-[9px] text-white/25 tracking-widest uppercase">Command v2</p>
                        </div>
                    </Link>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
                    {NAV.map((item) => {
                        const active = pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                        const Icon = item.icon;

                        return (
                            <Link key={item.href} href={item.href}
                                className={`
                                    relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                                    transition-all duration-200 group
                                    ${active
                                        ? "text-white"
                                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                                    }
                                `}>
                                {/* Active background glow */}
                                {active && (
                                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.06] to-transparent" />
                                        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-full"
                                            style={{ background: item.color, boxShadow: `0 0 12px ${item.color}60` }} />
                                    </div>
                                )}

                                <Icon className="w-4 h-4 relative z-10 flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                                    style={active ? { color: item.color, filter: `drop-shadow(0 0 4px ${item.color}60)` } : {}} />
                                <span className="relative z-10 truncate">{item.label}</span>

                                {/* Alert/live dot for Alerts */}
                                {item.label === "Alerts" && (
                                    <span className="ml-auto w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)] relative z-10" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Bottom section */}
                <div className="p-4 border-t border-white/[0.04]">
                    <div className="flex items-center gap-2.5 px-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white/60 border border-white/[0.08]">
                            D
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/60">Dr. Admin</p>
                            <p className="text-[10px] text-white/25">SIH 2026</p>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
