"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    Users, AlertTriangle, Pill, Building2, RefreshCw,
    TrendingUp, CheckCircle2, Zap, Heart
} from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import GlassCard from "@/components/ui/GlassCard";
import CircularGauge from "@/components/ui/CircularGauge";
import { LoadingOverlay } from "@/components/ui/Loading";
import { getDashboard, getAlerts, acknowledgeAlert } from "@/lib/api";
import {
    PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const DEMO = {
    patients: {
        total: 24,
        by_disease: [
            { "Hypertension": 6 }, { "Diabetes": 5 }, { "COPD": 4 },
            { "Heart Failure": 3 }, { "Asthma": 3 }, { "Pneumonia": 3 },
        ],
    },
    alerts: {
        active: 7, total_alerts: 42, acknowledged: 18, resolved: 17,
        by_severity: { low: 12, medium: 15, high: 10, critical: 5 },
    },
    medications: { adherence_rate_percent: 78 },
    hospital: {
        occupancy_rate_percent: 72,
        general: { total: 30, occupied: 20, available: 10 },
        icu: { total: 10, occupied: 8, available: 2 },
        emergency: { total: 10, occupied: 7, available: 3 },
    },
    lifecycle: { recovery_rate_percent: 65, total_patients_ever: 48 },
};

const DEMO_ALERTS = [
    { alert_id: "a1", severity: "critical", message: "Heart rate exceeding 150 bpm — Arjun Patel", status: "active" },
    { alert_id: "a2", severity: "high", message: "SpO2 dropped below 90% — Priya Sharma", status: "active" },
    { alert_id: "a3", severity: "medium", message: "Blood pressure elevated — Rahul Kumar", status: "acknowledged" },
    { alert_id: "a4", severity: "low", message: "Temperature slightly elevated — Ananya Gupta", status: "resolved" },
    { alert_id: "a5", severity: "high", message: "Irregular ECG pattern — Vikram Singh", status: "active" },
];

const DISEASE_COLORS = ["#06b6d4", "#a855f7", "#f59e0b", "#10b981", "#ef4444", "#3b82f6"];
const SEVERITY_COLORS: Record<string, string> = { low: "#3b82f6", medium: "#eab308", high: "#f97316", critical: "#ef4444" };

const fadeIn = {
    hidden: { opacity: 0, y: 15 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

export default function DashboardPage() {
    const [data, setData] = useState<any>(DEMO);
    const [alerts, setAlerts] = useState<any[]>(DEMO_ALERTS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [d, a] = await Promise.all([getDashboard(), getAlerts({ limit: 5 })]);
                if (d.data) setData(d.data);
                if (a.data?.length) setAlerts(a.data);
            } catch { /* use demo */ }
            setLoading(false);
        })();
    }, []);

    if (loading) return <LoadingOverlay message="Loading command center..." />;

    const diseaseData = (data.patients?.by_disease || []).map((d: any, i: number) => {
        const [name, value] = Object.entries(d)[0] as [string, number];
        return { name, value, color: DISEASE_COLORS[i % DISEASE_COLORS.length] };
    });

    const severityData = Object.entries(data.alerts?.by_severity || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: value as number,
        color: SEVERITY_COLORS[name] || "#666",
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-display">Command Center</h1>
                    <p className="text-xs text-white/30 mt-0.5">Real-time hospital overview</p>
                </div>
            </motion.div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { icon: <Users className="w-5 h-5" />, label: "Total Patients", value: data.patients?.total || 0, color: "#06b6d4", trend: "+3", trendUp: true },
                    { icon: <AlertTriangle className="w-5 h-5" />, label: "Active Alerts", value: data.alerts?.active || 0, color: "#ef4444", pulse: true },
                    { icon: <Pill className="w-5 h-5" />, label: "Med Adherence", value: `${data.medications?.adherence_rate_percent || 0}%`, color: "#10b981" },
                    { icon: <Building2 className="w-5 h-5" />, label: "Bed Occupancy", value: `${data.hospital?.occupancy_rate_percent || 0}%`, color: "#a855f7" },
                ].map((stat, i) => (
                    <motion.div key={stat.label} custom={i} variants={fadeIn} initial="hidden" animate="show">
                        <StatCard {...stat} glowColor={stat.color} />
                    </motion.div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <motion.div custom={4} variants={fadeIn} initial="hidden" animate="show">
                    <GlassCard className="p-5">
                        <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">Disease Distribution</h3>
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="50%" height={200}>
                                <PieChart>
                                    <Pie data={diseaseData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} strokeWidth={0}>
                                        {diseaseData.map((d: any, i: number) => <Cell key={i} fill={d.color} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex-1 space-y-1.5">
                                {diseaseData.slice(0, 6).map((d: any) => (
                                    <div key={d.name} className="flex items-center gap-2 text-xs">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                        <span className="text-white/40 truncate">{d.name}</span>
                                        <span className="ml-auto font-semibold" style={{ color: d.color }}>{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div custom={5} variants={fadeIn} initial="hidden" animate="show">
                    <GlassCard className="p-5">
                        <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">Alert Severity</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={severityData} barCategoryGap="25%">
                                <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} cursor={{ fill: "rgba(255,255,255,0.02)" }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {severityData.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <motion.div custom={6} variants={fadeIn} initial="hidden" animate="show">
                    <GlassCard className="p-5">
                        <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">Unit Capacity</h3>
                        <div className="space-y-4">
                            {[
                                { type: "general", label: "General Ward", color: "#06b6d4" },
                                { type: "icu", label: "ICU", color: "#8b5cf6" },
                                { type: "emergency", label: "Emergency", color: "#ef4444" },
                            ].map(({ type, label, color }) => {
                                const unit = data.hospital?.[type] || { total: 0, occupied: 0 };
                                const pct = unit.total ? Math.round((unit.occupied / unit.total) * 100) : 0;
                                return (
                                    <div key={type}>
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <span className="text-white/40">{label}</span>
                                            <span className="font-bold" style={{ color }}>{unit.occupied}/{unit.total}</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, delay: 0.3 }}
                                                className="h-full rounded-full"
                                                style={{ background: `linear-gradient(90deg, ${color}, ${color}80)`, boxShadow: `0 0 10px ${color}30` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </GlassCard>
                </motion.div>

                <motion.div custom={7} variants={fadeIn} initial="hidden" animate="show">
                    <GlassCard className="p-5">
                        <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">Recovery Rate</h3>
                        <div className="flex items-center justify-center py-4">
                            <CircularGauge value={data.lifecycle?.recovery_rate_percent || 0} size={130} color="#10b981" label="Recovery" />
                        </div>
                        <p className="text-center text-[11px] text-white/20 mt-1">{data.lifecycle?.total_patients_ever || 0} patients treated</p>
                    </GlassCard>
                </motion.div>

                <motion.div custom={8} variants={fadeIn} initial="hidden" animate="show">
                    <GlassCard className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Live Feed</h3>
                            <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            {alerts.slice(0, 5).map((a: any, i: number) => (
                                <div key={a.alert_id || i}
                                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-colors">
                                    <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ background: SEVERITY_COLORS[a.severity] || "#666", boxShadow: `0 0 8px ${SEVERITY_COLORS[a.severity] || "#666"}50` }} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] text-white/60 leading-snug">{a.message}</p>
                                        <p className="text-[10px] text-white/20 mt-0.5 uppercase">{a.severity}</p>
                                    </div>
                                    {a.status === "active" && (
                                        <button onClick={() => acknowledgeAlert(a.alert_id).catch(() => { })}
                                            className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                                            <CheckCircle2 className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
