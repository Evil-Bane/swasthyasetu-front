"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import BedMap from "@/components/hospital/BedMap";
import { LoadingOverlay } from "@/components/ui/Loading";
import { getHospitalStats, getHospitalBeds } from "@/lib/api";

const DEMO_STATS = {
    total_beds: 50, occupied: 36, available: 14, occupancy_rate: 72,
    general: { total: 30, occupied: 20, available: 10 },
    icu: { total: 10, occupied: 8, available: 2 },
    emergency: { total: 10, occupied: 8, available: 2 },
};
const DEMO_BEDS = Array.from({ length: 50 }, (_, i) => ({
    bed_id: `bed-${i + 1}`,
    bed_type: i < 30 ? "general" : i < 40 ? "icu" : "emergency",
    ward: i < 30 ? "General Ward" : i < 40 ? "ICU" : "Emergency",
    is_occupied: Math.random() > 0.3,
    patient_name: Math.random() > 0.3 ? ["Arjun", "Priya", "Rahul", "Ananya", "Vikram", "Meera"][Math.floor(Math.random() * 6)] : null,
}));

export default function HospitalPage() {
    const [stats, setStats] = useState<any>(DEMO_STATS);
    const [beds, setBeds] = useState<any[]>([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [s, b] = await Promise.all([getHospitalStats(), getHospitalBeds()]);
                if (s.data) setStats(s.data);
                setBeds(b.data?.length ? b.data : DEMO_BEDS);
            } catch { setBeds(DEMO_BEDS); }
            setLoading(false);
        })();
    }, []);

    const filtered = filter ? beds.filter((b) => (b.bed_type || "").toLowerCase() === filter.toLowerCase()) : beds;

    if (loading) return <LoadingOverlay message="Loading hospital data..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-violet-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-display">Hospital Resources</h1>
                    <p className="text-xs text-white/30 mt-0.5">Bed map & occupancy</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={<Building2 className="w-5 h-5" />} label="Total Beds" value={stats.total_beds} glowColor="#8b5cf6" />
                <StatCard icon="🟢" label="Available" value={stats.available} glowColor="#10b981" />
                <StatCard icon="🔴" label="Occupied" value={stats.occupied} glowColor="#ef4444" />
                <StatCard icon="📊" label="Occupancy" value={`${stats.occupancy_rate ?? stats.occupancy_rate_percent ?? 0}%`} glowColor="#06b6d4" />
            </div>

            <div className="flex items-center gap-2">
                {["", "general", "icu", "emergency"].map((t) => (
                    <button key={t} onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === t ? "bg-white/[0.08] text-white border border-white/[0.12]" : "bg-white/[0.02] text-white/30 border border-transparent hover:bg-white/[0.04]"}`}>
                        {t ? t.charAt(0).toUpperCase() + t.slice(1) : "All"}
                    </button>
                ))}
            </div>

            <GlassCard className="p-5">
                <BedMap beds={filtered} />
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { type: "general", label: "General Ward", color: "#06b6d4" },
                    { type: "icu", label: "ICU", color: "#8b5cf6" },
                    { type: "emergency", label: "Emergency", color: "#ef4444" },
                ].map(({ type, label, color }) => {
                    const unit = stats[type] || { total: 0, occupied: 0, available: 0 };
                    const pct = unit.total ? Math.round((unit.occupied / unit.total) * 100) : 0;
                    return (
                        <GlassCard key={type} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-white/40">{label}</span>
                                <span className="text-xs font-bold" style={{ color }}>{pct}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
                                    className="h-full rounded-full"
                                    style={{ background: color, boxShadow: `0 0 10px ${color}30` }} />
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-white/20">
                                <span>{unit.occupied} occupied</span>
                                <span>{unit.available} free</span>
                            </div>
                        </GlassCard>
                    );
                })}
            </div>
        </div>
    );
}
