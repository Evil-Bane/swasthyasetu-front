"use client";

interface Props {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    glowColor?: string;
    trend?: string;
    trendUp?: boolean;
    pulse?: boolean;
}

export default function StatCard({ icon, label, value, glowColor, trend, trendUp, pulse }: Props) {
    return (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.07] p-5 transition-all duration-300 hover:from-white/[0.07] hover:to-white/[0.04] hover:border-white/[0.12] group"
            style={{
                boxShadow: glowColor
                    ? `0 0 25px ${glowColor}08, 0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}>
            {/* Subtle gradient orb behind icon on hover */}
            {glowColor && (
                <div className="absolute -top-4 -left-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${glowColor}12, transparent 70%)` }} />
            )}

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border border-white/[0.06]"
                        style={{
                            background: glowColor ? `linear-gradient(135deg, ${glowColor}15, ${glowColor}05)` : "rgba(255,255,255,0.04)",
                            color: glowColor || "rgba(255,255,255,0.6)",
                        }}>
                        {icon}
                    </div>
                    <div>
                        <p className="text-[11px] text-white/35 uppercase tracking-wider font-medium">{label}</p>
                        <p className={`text-2xl font-bold mt-0.5 ${pulse ? "animate-pulse" : ""}`}
                            style={glowColor ? { color: glowColor, textShadow: `0 0 20px ${glowColor}40` } : {}}>
                            {value}
                        </p>
                    </div>
                </div>
                {trend && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border ${trendUp
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/15"
                        : "bg-red-500/10 text-red-400 border-red-500/15"
                        }`}>
                        {trendUp ? "↑" : "↓"} {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
