"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Calendar, Clock, X, CheckCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StreakLeaderboard from "@/components/medications/StreakLeaderboard";
import { LoadingOverlay, Spinner } from "@/components/ui/Loading";
import { getMedications, getMedicationStats, getHospitalBeds, markMedication, markAllMedications } from "@/lib/api";

const NAMES = ["Arjun Patel", "Priya Sharma", "Vikram Singh", "Ananya Gupta", "Neha Verma", "Karan Joshi", "Meera Reddy", "Rahul Kumar"];
const ROOMS = ["GEN-001", "GEN-005", "ICU-003", "GEN-012", "EMR-002", "GEN-008", "ICU-007", "GEN-015"];
const TIME_SLOTS = [
    { key: "morning", label: "Morning", time: "8:00 AM", icon: "🌅", color: "#f59e0b" },
    { key: "afternoon", label: "Afternoon", time: "1:00 PM", icon: "☀️", color: "#06b6d4" },
    { key: "evening", label: "Evening", time: "6:00 PM", icon: "🌆", color: "#a855f7" },
    { key: "night", label: "Night", time: "10:00 PM", icon: "🌙", color: "#3b82f6" },
];

const DEMO_STATS = {
    adherence_rate: 78, total_medications: 42, taken: 33, missed: 9, top_streaks: [
        { patient_name: "Arjun Patel", streak: 14 }, { patient_name: "Priya Sharma", streak: 11 },
        { patient_name: "Vikram Singh", streak: 9 }, { patient_name: "Ananya Gupta", streak: 7 },
        { patient_name: "Neha Verma", streak: 5 },
    ]
};

export default function MedicationsPage() {
    const [stats, setStats] = useState<any>(DEMO_STATS);
    const [meds, setMeds] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [bedMap, setBedMap] = useState<Record<string, string>>({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [marking, setMarking] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [s, m, beds] = await Promise.all([getMedicationStats(), getMedications(), getHospitalBeds()]);
            if (s.data) {
                const streaks = (s.data.top_streaks || []).map((st: any, i: number) => ({
                    ...st,
                    patient_name: st.patient_name && st.patient_name !== "Patient" ? st.patient_name : NAMES[i % NAMES.length],
                }));
                setStats({ ...s.data, top_streaks: streaks });
            }

            const bMap: Record<string, string> = {};
            (beds.data || []).forEach((b: any) => {
                if (b.patient_id && (b.is_occupied || b.occupancy_status === "occupied")) {
                    bMap[b.patient_id] = b.bed_label || b.bed_id || "";
                }
            });
            setBedMap(bMap);

            const medData = m.data || [];
            setMeds(medData.map((md: any, i: number) => ({
                ...md,
                patient_name: md.patient_name && md.patient_name !== "Patient" ? md.patient_name : NAMES[i % NAMES.length],
            })));
        } catch { /* keep existing */ }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();
    const isPast = selectedDate < today && !isToday;

    const changeDate = (delta: number) => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + delta);
        setSelectedDate(d);
    };

    /* ── Mark a single med as taken/missed ── */
    const handleMark = async (m: any, action: "taken" | "missed") => {
        const key = `${m.patient_id}-${m.medication_name}`;
        setMarking(key);
        try {
            await markMedication(m.patient_id, m.medication_name, action);
            // Optimistic update
            setMeds(prev => prev.map(med =>
                med.patient_id === m.patient_id && med.medication_name === m.medication_name
                    ? { ...med, status: action }
                    : med
            ));
        } catch { /* silent */ }
        setMarking(null);
    };

    /* ── Mark ALL meds for a patient as taken ── */
    const handleMarkAll = async (patientId: string) => {
        setMarkingAll(patientId);
        try {
            await markAllMedications(patientId);
            // Optimistic update
            setMeds(prev => prev.map(med =>
                med.patient_id === patientId ? { ...med, status: "taken" } : med
            ));
        } catch { /* silent */ }
        setMarkingAll(null);
    };

    /* Map meds into time slots */
    const slotMeds = useMemo(() => {
        const result: Record<string, any[]> = {};
        TIME_SLOTS.forEach(s => { result[s.key] = []; });

        meds.forEach((m, idx) => {
            const schedule = (m.schedule || "Morning").toLowerCase();
            const room = m.room || bedMap[m.patient_id] || ROOMS[idx % ROOMS.length];
            const displayStatus = isPast ? "taken" : (m.status || "pending");
            const med = { ...m, room, _displayStatus: displayStatus };

            if (schedule.includes("morning") && schedule.includes("evening")) {
                result["morning"].push(med);
                result["evening"].push(med);
            } else if (schedule.includes("morning")) {
                result["morning"].push(med);
            } else if (schedule.includes("afternoon")) {
                result["afternoon"].push(med);
            } else if (schedule.includes("evening")) {
                result["evening"].push(med);
            } else if (schedule.includes("night")) {
                result["night"].push(med);
            } else {
                result["morning"].push(med);
            }
        });
        return result;
    }, [meds, bedMap, isPast]);

    const statusClasses = (s: string) => s === "taken" ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/15"
        : s === "missed" ? "text-red-400 bg-red-500/10 border-red-500/15"
            : "text-amber-400 bg-amber-500/10 border-amber-500/15";

    const allMeds = Object.values(slotMeds).flat();
    const totalForDay = allMeds.length;
    const takenForDay = allMeds.filter(m => m._displayStatus === "taken").length;

    /* Unique patients for "Mark All" */
    const uniquePatients = useMemo(() => {
        const map = new Map<string, { patient_id: string; patient_name: string; total: number; taken: number }>();
        allMeds.forEach(m => {
            const existing = map.get(m.patient_id);
            if (existing) {
                existing.total++;
                if (m._displayStatus === "taken") existing.taken++;
            } else {
                map.set(m.patient_id, {
                    patient_id: m.patient_id,
                    patient_name: m.patient_name,
                    total: 1,
                    taken: m._displayStatus === "taken" ? 1 : 0,
                });
            }
        });
        return Array.from(map.values());
    }, [allMeds]);

    if (loading) return <LoadingOverlay message="Loading medications..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
                    <Pill className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-display">Medication Schedule</h1>
                    <p className="text-xs text-white/30 mt-0.5">Daily adherence & calendar view</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={<Pill className="w-5 h-5" />} label="Adherence Rate" value={`${stats.adherence_rate ?? stats.adherence_rate_percent ?? 0}%`} glowColor="#a855f7" />
                <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Taken" value={stats.taken} glowColor="#10b981" />
                <StatCard icon={<XCircle className="w-5 h-5" />} label="Missed" value={stats.missed} glowColor="#ef4444" />
                <StatCard icon={<Calendar className="w-5 h-5" />} label="Today's Progress" value={`${takenForDay}/${totalForDay}`} glowColor="#06b6d4" />
            </div>

            {/* Date Navigation */}
            <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                    <button onClick={() => changeDate(-1)}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <h3 className="text-lg font-bold">
                            {isToday ? "Today" : selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                        </h3>
                        <p className="text-xs text-white/30">
                            {selectedDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {!isToday && (
                            <button onClick={() => setSelectedDate(new Date())}
                                className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all">
                                Today
                            </button>
                        )}
                        <button onClick={() => changeDate(1)}
                            className="p-2 rounded-xl hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Week strip */}
                <div className="flex gap-1.5 mt-3 justify-center">
                    {Array.from({ length: 7 }, (_, i) => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() - 3 + i);
                        const isActive = d.toDateString() === selectedDate.toDateString();
                        const isTodayDot = d.toDateString() === today.toDateString();
                        return (
                            <button key={i} onClick={() => setSelectedDate(new Date(d))}
                                className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl transition-all min-w-[44px] ${isActive
                                    ? "bg-cyan-500/15 border border-cyan-500/25 text-cyan-400"
                                    : "hover:bg-white/[0.03] text-white/25"}`}>
                                <span className="text-[9px] font-medium">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                                <span className="text-sm font-bold">{d.getDate()}</span>
                                {isTodayDot && !isActive && <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5" />}
                            </button>
                        );
                    })}
                </div>
            </GlassCard>

            {/* Quick Mark All — per patient */}
            {isToday && uniquePatients.some(p => p.taken < p.total) && (
                <GlassCard className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <CheckCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quick Actions — Mark All Taken</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {uniquePatients.filter(p => p.taken < p.total).map((p) => (
                            <button key={p.patient_id}
                                onClick={() => handleMarkAll(p.patient_id)}
                                disabled={markingAll === p.patient_id}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-all disabled:opacity-50">
                                {markingAll === p.patient_id ? (
                                    <Spinner size={12} />
                                ) : (
                                    <CheckCheck className="w-3.5 h-3.5" />
                                )}
                                {p.patient_name}
                                <span className="text-[9px] text-emerald-400/50">({p.taken}/{p.total})</span>
                            </button>
                        ))}
                    </div>
                </GlassCard>
            )}

            {/* Time Slot Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    {TIME_SLOTS.map((slot) => {
                        const items = slotMeds[slot.key] || [];
                        if (items.length === 0) return null;
                        return (
                            <GlassCard key={slot.key} className="p-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-lg">{slot.icon}</span>
                                    <div>
                                        <h4 className="text-sm font-semibold" style={{ color: slot.color }}>{slot.label}</h4>
                                        <p className="text-[10px] text-white/20">{slot.time} • {items.length} medication{items.length > 1 ? "s" : ""}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {items.map((m: any, i: number) => {
                                        const markKey = `${m.patient_id}-${m.medication_name}`;
                                        const isTaken = m._displayStatus === "taken";
                                        const isMissed = m._displayStatus === "missed";
                                        const isPending = !isTaken && !isMissed;
                                        return (
                                            <motion.div key={`${m.medication_id || i}-${slot.key}`}
                                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isTaken
                                                    ? "bg-emerald-500/[0.04] border-emerald-500/10"
                                                    : isMissed ? "bg-red-500/[0.04] border-red-500/10"
                                                        : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"} group`}>

                                                {/* Status indicator */}
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isTaken ? "bg-emerald-500/15 text-emerald-400"
                                                    : isMissed ? "bg-red-500/15 text-red-400"
                                                        : "bg-white/[0.04] text-white/20"}`}>
                                                    {isTaken ? <CheckCircle2 className="w-4 h-4" /> : isMissed ? <XCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>

                                                {/* Med info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => setSelectedPatient(m)}
                                                            className={`text-sm font-medium truncate transition-colors ${isTaken ? "text-emerald-400/70 line-through" : "text-white/60 hover:text-cyan-400"}`}>
                                                            {m.patient_name}
                                                        </button>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-white/25 font-mono flex-shrink-0">
                                                            {m.room}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs mt-0.5 ${isTaken ? "text-white/15 line-through" : "text-white/30"}`}>{m.medication_name}</p>
                                                </div>

                                                {/* Action buttons — only for today's pending meds */}
                                                {isToday && isPending && (
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <button onClick={() => handleMark(m, "taken")}
                                                            disabled={marking === markKey}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                                                            {marking === markKey ? <Spinner size={10} /> : <CheckCircle2 className="w-3 h-3" />}
                                                            Taken
                                                        </button>
                                                        <button onClick={() => handleMark(m, "missed")}
                                                            disabled={marking === markKey}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-all disabled:opacity-50">
                                                            <XCircle className="w-3 h-3" />
                                                            Missed
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Completed badge */}
                                                {(isTaken || isMissed) && (
                                                    <span className={`text-[10px] px-2 py-1 rounded-full border font-medium flex-shrink-0 ${statusClasses(m._displayStatus)}`}>
                                                        {isTaken ? "✓ Taken" : "✗ Missed"}
                                                    </span>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </GlassCard>
                        );
                    })}

                    {allMeds.length === 0 && (
                        <GlassCard className="p-12 text-center">
                            <Pill className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-sm text-white/25">No medications scheduled for this date</p>
                        </GlassCard>
                    )}
                </div>

                <GlassCard className="p-5 h-fit">
                    <h3 className="text-xs font-semibold text-white/40 mb-4 uppercase tracking-wider">🏆 Streak Leaders</h3>
                    <StreakLeaderboard streaks={stats.top_streaks || []} />
                </GlassCard>
            </div>

            {/* Patient Detail Popup */}
            <AnimatePresence>
                {selectedPatient && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedPatient(null)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm mx-4 p-6 rounded-2xl bg-gradient-to-br from-[#141828] to-[#0d1020] border border-white/[0.08] shadow-2xl shadow-black/40">
                            <button onClick={() => setSelectedPatient(null)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/[0.08] flex items-center justify-center text-sm font-bold">
                                    {selectedPatient.patient_name?.[0] || "P"}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">{selectedPatient.patient_name}</h3>
                                    <p className="text-[10px] text-white/25 font-mono">{selectedPatient.patient_id?.slice(0, 16) || "—"}</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                {[
                                    { label: "Room / Bed", value: selectedPatient.room },
                                    { label: "Medication", value: selectedPatient.medication_name },
                                    { label: "Schedule", value: selectedPatient.schedule },
                                    { label: "Status", value: selectedPatient._displayStatus || selectedPatient.status },
                                ].filter(r => r.value).map(({ label, value }) => (
                                    <div key={label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-xs text-white/30">{label}</span>
                                        {label === "Status" ? (
                                            <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${statusClasses(value)}`}>{value}</span>
                                        ) : (
                                            <span className="text-xs font-medium text-white/60">{value}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
