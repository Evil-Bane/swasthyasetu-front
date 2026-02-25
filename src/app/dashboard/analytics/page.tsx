"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { LoadingOverlay } from "@/components/ui/Loading";
import { getLifecycleStats, getVitalTrends, getDashboard } from "@/lib/api";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Area, AreaChart,
} from "recharts";

const DEMO_LIFECYCLE = { total_patients_ever: 48, currently_active: 24, discharged: 18, expired_patients: 1, avg_stay_days: 4.2, recovery_rate_percent: 65 };

/* Generate realistic hourly trend data */
const makeTrends = () => Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, "0")}:00`,
    avg_heart_rate: +(72 + Math.sin(i * 0.4) * 8 + (Math.random() - 0.5) * 6).toFixed(1),
    avg_spo2: +(96.5 + Math.sin(i * 0.3) * 1.5 + (Math.random() - 0.5) * 1).toFixed(1),
    avg_systolic: +(122 + Math.sin(i * 0.35) * 10 + (Math.random() - 0.5) * 8).toFixed(0),
}));

const DEMO_TRENDS = makeTrends();

const DEMO_DISEASE = [
    { name: "Hypertension", value: 6 }, { name: "Diabetes", value: 5 },
    { name: "COPD", value: 4 }, { name: "Heart Failure", value: 3 },
    { name: "Asthma", value: 3 }, { name: "Pneumonia", value: 3 },
];
const DEMO_GENDER = [
    { name: "Male", value: 14, color: "#06b6d4" },
    { name: "Female", value: 10, color: "#ec4899" },
    { name: "Other", value: 2, color: "#a855f7" },
];
const PIE_COLORS = ["#06b6d4", "#a855f7", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6"];

export default function AnalyticsPage() {
    const [lifecycle, setLifecycle] = useState<any>(DEMO_LIFECYCLE);
    const [trends, setTrends] = useState<any[]>(DEMO_TRENDS);
    const [disease, setDisease] = useState<any[]>(DEMO_DISEASE);
    const [gender, setGender] = useState<any[]>(DEMO_GENDER);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [lc, tr, dash] = await Promise.all([getLifecycleStats(), getVitalTrends(), getDashboard()]);
                if (lc.data) setLifecycle(lc.data);

                // Process trends
                if (tr.data?.length) {
                    setTrends(tr.data.map((t: any) => ({
                        hour: t.hour || t.timestamp || "",
                        avg_heart_rate: Number(t.avg_heart_rate || t.heart_rate || 0),
                        avg_spo2: Number(t.avg_spo2 || t.spo2 || 0),
                        avg_systolic: Number(t.avg_systolic || t.systolic || 0),
                    })));
                }

                if (dash.data?.patients) {
                    const diseases = (dash.data.patients.by_disease || []).map((d: any) => {
                        const [name, value] = Object.entries(d)[0] as [string, number];
                        return { name, value };
                    });
                    if (diseases.length) setDisease(diseases);

                    const genders = (dash.data.patients.by_gender || []).map((g: any) => {
                        const [name, value] = Object.entries(g)[0] as [string, number];
                        const colorMap: Record<string, string> = { Male: "#06b6d4", Female: "#ec4899", Other: "#a855f7", Unknown: "#64748b" };
                        return { name, value, color: colorMap[name] || "#a855f7" };
                    });
                    if (genders.length) setGender(genders);
                }
            } catch { /* use demo */ }
            setLoading(false);
        })();
    }, []);

    if (loading) return <LoadingOverlay message="Loading analytics..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-display">Analytics & Trends</h1>
                    <p className="text-xs text-white/30 mt-0.5">Population health insights</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                    { label: "Total Ever", value: lifecycle.total_patients_ever, color: "#06b6d4" },
                    { label: "Active", value: lifecycle.currently_active ?? lifecycle.active_patients, color: "#10b981" },
                    { label: "Discharged", value: lifecycle.discharged ?? lifecycle.discharged_patients, color: "#3b82f6" },
                    { label: "Avg Stay", value: `${(lifecycle.avg_stay_days || 0).toFixed?.(1) || lifecycle.avg_stay_days}d`, color: "#f59e0b" },
                    { label: "Recovery", value: `${lifecycle.recovery_rate_percent ?? 0}%`, color: "#a855f7" },
                    { label: "Mortality", value: lifecycle.expired_patients || 0, color: "#ef4444" },
                ].map((s) => (
                    <GlassCard key={s.label} className="p-3.5 text-center">
                        <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    </GlassCard>
                ))}
            </div>

            {/* Vital Trends — Area Chart for better visual */}
            <GlassCard className="p-5">
                <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">Vital Trends (24h)</h3>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={trends}>
                        <defs>
                            <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="bpGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="hour" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                        <Area type="monotone" dataKey="avg_heart_rate" stroke="#ef4444" strokeWidth={2} fill="url(#hrGrad)" name="Heart Rate" dot={false} />
                        <Area type="monotone" dataKey="avg_spo2" stroke="#06b6d4" strokeWidth={2} fill="url(#spo2Grad)" name="SpO2" dot={false} />
                        <Area type="monotone" dataKey="avg_systolic" stroke="#a855f7" strokeWidth={2} fill="url(#bpGrad)" name="Systolic BP" dot={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                    <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Disease Distribution</h3>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie data={disease} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={0}>
                                    {disease.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-1.5">
                            {disease.map((d, i) => (
                                <div key={d.name} className="flex items-center gap-2 text-xs">
                                    <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-white/40 truncate">{d.name}</span>
                                    <span className="ml-auto font-semibold text-white/60">{d.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-5">
                    <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">Demographics</h3>
                    <div className="flex items-center gap-6">
                        <ResponsiveContainer width="50%" height={200}>
                            <PieChart>
                                <Pie data={gender} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} strokeWidth={0}>
                                    {gender.map((g, i) => <Cell key={i} fill={g.color || "#a855f7"} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex-1 space-y-3">
                            {gender.map((g) => (
                                <div key={g.name}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="text-white/40">{g.name}</span>
                                        <span className="font-semibold" style={{ color: g.color }}>{g.value}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(g.value / (gender.reduce((a: number, b: any) => a + b.value, 0) || 1)) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.3 }}
                                            className="h-full rounded-full" style={{ background: g.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
}
