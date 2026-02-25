"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Eye, Filter } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import { LoadingOverlay } from "@/components/ui/Loading";
import { getAlerts, getAlertStats, acknowledgeAlert, resolveAlert } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const SEVERITY_COLORS: Record<string, string> = { low: "#3b82f6", medium: "#eab308", high: "#f97316", critical: "#ef4444" };
const STATUS_COLORS: Record<string, string> = { active: "#ef4444", acknowledged: "#eab308", resolved: "#10b981" };

const DEMO_STATS = { active: 7, acknowledged: 18, resolved: 17, total: 42, by_severity: { low: 12, medium: 15, high: 10, critical: 5 }, by_type: { heart_rate: 14, spo2: 10, blood_pressure: 12, temperature: 6 } };
const DEMO_ALERTS = [
    { alert_id: "a1", patient_name: "Arjun Patel", severity: "critical", alert_type: "heart_rate", message: "Heart rate 162 bpm — exceeds threshold", status: "active" },
    { alert_id: "a2", patient_name: "Priya Sharma", severity: "high", alert_type: "spo2", message: "SpO2 dropped to 88%", status: "active" },
    { alert_id: "a3", patient_name: "Rahul Kumar", severity: "medium", alert_type: "blood_pressure", message: "Blood pressure 160/105", status: "acknowledged" },
    { alert_id: "a4", patient_name: "Ananya Gupta", severity: "low", alert_type: "temperature", message: "Temperature 37.8°C", status: "resolved" },
    { alert_id: "a5", patient_name: "Vikram Singh", severity: "high", alert_type: "heart_rate", message: "Irregular ECG pattern", status: "active" },
    { alert_id: "a6", patient_name: "Meera Reddy", severity: "medium", alert_type: "spo2", message: "SpO2 at 92%", status: "acknowledged" },
];

export default function AlertsPage() {
    const [stats, setStats] = useState<any>(DEMO_STATS);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [status, setStatus] = useState("");
    const [severity, setSeverity] = useState("");
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [s, a] = await Promise.all([getAlertStats(), getAlerts({ status: status || undefined, severity: severity || undefined, limit: 50 })]);
            if (s.data) setStats(s.data);
            setAlerts(a.data?.length ? a.data : DEMO_ALERTS);
        } catch { setAlerts(DEMO_ALERTS); }
        setLoading(false);
    };

    const handleResolveAll = async () => {
        setResolving(true);
        const toResolve = alerts.filter((a) => a.status === "active" || a.status === "acknowledged");
        try {
            await Promise.allSettled(toResolve.map((a) => resolveAlert(a.alert_id)));
        } catch { }
        // For demo mode, mark all as resolved locally
        setAlerts((prev) => prev.map((a) => ({ ...a, status: "resolved" })));
        setStats((prev: any) => ({ ...prev, active: 0, acknowledged: 0, resolved: (prev.resolved || 0) + (prev.active || 0) + (prev.acknowledged || 0) }));
        setResolving(false);
    };

    useEffect(() => { load(); }, [status, severity]);

    const sevData = Object.entries(stats.by_severity || {}).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v as number, color: SEVERITY_COLORS[k] || "#666" }));
    const typeData = Object.entries(stats.by_type || {}).map(([k, v]) => ({ name: k.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()), value: v as number }));

    const filtered = alerts.filter((a) => (!status || a.status === status) && (!severity || a.severity === severity));
    const hasUnresolved = alerts.some((a) => a.status !== "resolved");

    if (loading) return <LoadingOverlay message="Loading alerts..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-display">Alerts Command</h1>
                        <p className="text-xs text-white/30 mt-0.5">{filtered.length} alerts</p>
                    </div>
                </div>
                {hasUnresolved && (
                    <button onClick={handleResolveAll} disabled={resolving}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                        <CheckCircle2 className={`w-4 h-4 ${resolving ? "animate-spin" : ""}`} />
                        {resolving ? "Resolving..." : "Resolve All"}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Active" value={stats.active} glowColor="#ef4444" pulse />
                <StatCard icon={<Eye className="w-5 h-5" />} label="Acknowledged" value={stats.acknowledged} glowColor="#eab308" />
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Resolved" value={stats.resolved} glowColor="#10b981" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                    <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">By Severity</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={sevData} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {sevData.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
                <GlassCard className="p-5">
                    <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider">By Type</h3>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={typeData} barCategoryGap="25%">
                            <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }} />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#06b6d4" />
                        </BarChart>
                    </ResponsiveContainer>
                </GlassCard>
            </div>

            <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-white/20" />
                <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 focus:outline-none focus:border-cyan-500/30 transition-colors">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="resolved">Resolved</option>
                </select>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/60 focus:outline-none focus:border-cyan-500/30 transition-colors">
                    <option value="">All Severity</option>
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                </select>
            </div>

            <GlassCard className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/[0.06]">
                            {["Severity", "Patient", "Message", "Status", ""].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((a, i) => (
                            <motion.tr key={a.alert_id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                                <td className="px-5 py-3">
                                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: SEVERITY_COLORS[a.severity], boxShadow: `0 0 6px ${SEVERITY_COLORS[a.severity]}50` }} />
                                </td>
                                <td className="px-5 py-3 text-white/60">{a.patient_name || "—"}</td>
                                <td className="px-5 py-3 text-white/40 text-xs max-w-[300px] truncate">{a.message}</td>
                                <td className="px-5 py-3">
                                    <span className="text-[10px] px-2 py-1 rounded-full border" style={{ color: STATUS_COLORS[a.status], borderColor: `${STATUS_COLORS[a.status]}30`, background: `${STATUS_COLORS[a.status]}10` }}>{a.status}</span>
                                </td>
                                <td className="px-5 py-3">
                                    <div className="flex items-center gap-1">
                                        {a.status === "active" && (
                                            <button onClick={() => acknowledgeAlert(a.alert_id).then(load).catch(() => { })}
                                                className="text-[10px] px-2 py-1 rounded-md bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">Ack</button>
                                        )}
                                        {(a.status === "active" || a.status === "acknowledged") && (
                                            <button onClick={() => resolveAlert(a.alert_id).then(load).catch(() => { })}
                                                className="text-[10px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all">Resolve</button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );
}
