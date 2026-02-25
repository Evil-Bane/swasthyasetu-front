"use client";
import Sidebar from "@/components/navigation/Sidebar";
import dynamic from "next/dynamic";

const AlertNotificationSystem = dynamic(
    () => import("@/components/alerts/AlertNotificationSystem"),
    { ssr: false }
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* ── Rich Mesh Gradient Background ── */}
            <div className="fixed inset-0 z-0">
                {/* Base gradient — deep blue-purple instead of flat black */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a0e1a] via-[#0d0f1e] to-[#0f0a1a]" />

                {/* Ambient glow orbs */}
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
                <div className="absolute bottom-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-600/[0.05] blur-[100px] animate-pulse" style={{ animationDuration: "10s" }} />
                <div className="absolute top-[40%] right-[20%] w-[400px] h-[400px] rounded-full bg-emerald-500/[0.03] blur-[80px] animate-pulse" style={{ animationDuration: "12s" }} />
                <div className="absolute top-[10%] left-[40%] w-[300px] h-[300px] rounded-full bg-orange-500/[0.025] blur-[90px] animate-pulse" style={{ animationDuration: "14s" }} />

                {/* Subtle grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                        backgroundSize: "60px 60px",
                    }} />

                {/* Noise texture overlay for depth */}
                <div className="absolute inset-0 opacity-[0.015]"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                    }} />
            </div>

            <Sidebar />

            {/* Live Alert Notification Toasts */}
            <AlertNotificationSystem />

            <main className="ml-[220px] min-h-screen transition-all duration-300 relative z-10">
                <div className="p-6 lg:p-8 max-w-[1600px]">
                    {children}
                </div>
            </main>
        </div>
    );
}
