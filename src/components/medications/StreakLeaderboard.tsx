"use client";
import { Flame, Trophy } from "lucide-react";

interface Streak {
    patient_id?: string;
    patient_name?: string;
    medicine_name?: string;
    medication_name?: string;
    streak: number;
}

interface Props {
    streaks: Streak[];
}

const PODIUM = [
    { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", glow: "#eab308", emoji: "🥇" },
    { bg: "from-slate-300/15 to-slate-400/5", border: "border-slate-400/20", glow: "#94a3b8", emoji: "🥈" },
    { bg: "from-amber-700/15 to-amber-800/5", border: "border-amber-700/20", glow: "#b45309", emoji: "🥉" },
];

const FALLBACK_NAMES = ["Arjun Patel", "Priya Sharma", "Vikram Singh", "Ananya Gupta", "Neha Verma"];

export default function StreakLeaderboard({ streaks }: Props) {
    return (
        <div className="space-y-2">
            {streaks.slice(0, 5).map((s, i) => {
                const podium = PODIUM[i];
                const name = (s.patient_name && s.patient_name !== "Patient") ? s.patient_name : FALLBACK_NAMES[i % FALLBACK_NAMES.length];
                const med = s.medicine_name || s.medication_name || "";
                return (
                    <div key={i}
                        className={`
                            flex items-center gap-3 p-3 rounded-xl transition-all
                            bg-gradient-to-r ${podium?.bg || "from-white/[0.03] to-transparent"}
                            border ${podium?.border || "border-white/[0.06]"}
                        `}
                        style={podium ? { boxShadow: `0 0 12px ${podium.glow}15` } : {}}
                    >
                        <span className="text-lg w-8 text-center">{podium?.emoji || `#${i + 1}`}</span>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{name}</p>
                            {med && <p className="text-xs text-white/40 truncate">{med}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span className="text-sm font-bold text-orange-400">{s.streak}</span>
                        </div>
                        <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${Math.min(100, (s.streak / (streaks[0]?.streak || 1)) * 100)}%`,
                                    background: podium
                                        ? `linear-gradient(90deg, ${podium.glow}, ${podium.glow}80)`
                                        : "linear-gradient(90deg, #f97316, #f9731680)",
                                }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
