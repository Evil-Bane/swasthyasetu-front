"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Download, Heart, Thermometer, Droplets, Activity, ArrowLeft, CheckCircle2, LogOut, Calendar, Pill, ChevronLeft, ChevronRight, XCircle, Clock, CheckCheck } from "lucide-react";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CircularGauge from "@/components/ui/CircularGauge";
import ECGWaveform from "@/components/vitals/ECGWaveform";
import BodyDiagram from "@/components/patient/BodyDiagram";
import WebcamModal from "@/components/patient/WebcamModal";
import { Spinner } from "@/components/ui/Loading";
import { getPatient, getVitalHistory, downloadReport, checkRecovery, dischargePatient, getPatientMedications, markMedication, markAllMedications } from "@/lib/api";

/* ── Mini Calendar ── */
function MiniCalendar({ selectedDate, onSelect }: { selectedDate: Date; onSelect: (d: Date) => void }) {
    const [viewMonth, setViewMonth] = useState(new Date(selectedDate));
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
    const isSelected = (d: number) => d === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <button onClick={() => setViewMonth(new Date(year, month - 1))} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-white/50">
                    {viewMonth.toLocaleString("default", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => setViewMonth(new Date(year, month + 1))} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-[9px] text-center text-white/20 font-medium py-1">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map((d, i) => d ? (
                    <button key={i} onClick={() => onSelect(new Date(year, month, d))}
                        className={`w-8 h-8 rounded-lg text-[11px] font-medium transition-all ${isSelected(d)
                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                            : isToday(d) ? "bg-white/[0.06] text-white/70 border border-white/[0.08]"
                                : "text-white/30 hover:bg-white/[0.04] hover:text-white/50"}`}>
                        {d}
                    </button>
                ) : <div key={i} />)}
            </div>
        </div>
    );
}

export default function PatientDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const [patient, setPatient] = useState<any>(null);
    const [vitals, setVitals] = useState<any[]>([]);
    const [showCam, setShowCam] = useState(false);
    const [recovery, setRecovery] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [meds, setMeds] = useState<any[]>([]);
    const [medCalDate, setMedCalDate] = useState(new Date());
    const [loadingMeds, setLoadingMeds] = useState(false);
    const [marking, setMarking] = useState<string | null>(null);
    const [markingAll, setMarkingAll] = useState(false);

    useEffect(() => {
        if (!id) return;
        Promise.all([getPatient(id), getVitalHistory(id, 20)])
            .then(([p, v]) => {
                setPatient(p.data);
                setVitals(v.data || []);
            })
            .catch(console.error)
            .finally(() => setLoading(false));

        // Fetch medications
        setLoadingMeds(true);
        getPatientMedications(id)
            .then((res) => setMeds(res.data || []))
            .catch(() => setMeds([]))
            .finally(() => setLoadingMeds(false));
    }, [id]);

    const handleCheckRecovery = async () => {
        try {
            const r = await checkRecovery(id);
            setRecovery(r.data);
        } catch (e) { console.error(e); }
    };

    const handleMark = async (med: any, action: "taken" | "missed") => {
        const medName = med.medication_name || med.medicine_name || "";
        setMarking(medName);
        try {
            await markMedication(id, medName, action);
            setMeds(prev => prev.map(m =>
                (m.medication_name || m.medicine_name) === medName ? { ...m, status: action } : m
            ));
        } catch { /* silent */ }
        setMarking(null);
    };

    const handleMarkAll = async () => {
        setMarkingAll(true);
        try {
            await markAllMedications(id);
            setMeds(prev => prev.map(m => ({ ...m, status: "taken" })));
        } catch { /* silent */ }
        setMarkingAll(false);
    };

    const today = new Date();
    const isToday = medCalDate.toDateString() === today.toDateString();
    const isPast = medCalDate < today && !isToday;

    const medsForDate = useMemo(() => {
        return meds.map(m => ({
            ...m,
            _displayStatus: isPast ? "taken" : (m.status || "pending"),
        }));
    }, [meds, isPast]);

    const pendingCount = medsForDate.filter(m => m._displayStatus === "pending").length;

    if (loading || !patient) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
        );
    }

    const latestVital = vitals[0];
    const ecgData = latestVital?.ecg_signal || Array.from({ length: 50 }, (_, i) => Math.sin(i * 0.5) * 20 + 50);

    return (
        <div className="space-y-6">
            <WebcamModal isOpen={showCam} onClose={() => setShowCam(false)} patientName={patient.name} />

            {/* Back + Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard/patients"
                    className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-all">
                    <ArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{patient.name}</h1>
                    <p className="text-sm text-white/40">ID: {patient.patient_id?.slice(0, 8)} • {patient.age}y • {patient.gender}</p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${patient.status === "admitted"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : "bg-white/[0.04] text-white/40 border-white/[0.06]"
                    }`}>
                    {patient.status}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left - Patient Info */}
                <div className="space-y-4">
                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Patient Info</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Disease</span>
                                <span className="font-medium text-orange-400">{patient.disease}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-white/40">Bed</span>
                                <span className="font-mono text-xs text-white/60">{patient.assigned_bed || "None"}</span>
                            </div>
                            <div>
                                <span className="text-xs text-white/40 block mb-2">Medications</span>
                                <div className="space-y-1">
                                    {(patient.medications || []).map((m: string, i: number) => (
                                        <div key={i} className="text-xs px-2 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.04] text-white/60">
                                            💊 {m}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Camera Button */}
                    <button onClick={() => setShowCam(true)}
                        className="w-full flex items-center justify-center gap-3 p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 hover:border-red-500/40 transition-all group">
                        <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Camera className="w-6 h-6 text-red-400" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-red-400">Live Camera Feed</p>
                            <p className="text-xs text-white/30">Open patient webcam</p>
                        </div>
                    </button>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button onClick={() => downloadReport(id)}
                            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
                            <Download className="w-3.5 h-3.5" /> PDF Report
                        </button>
                        <button onClick={handleCheckRecovery}
                            className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-white/50 hover:text-white hover:bg-white/[0.06] transition-all">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Recovery
                        </button>
                    </div>
                    {recovery && (
                        <div className={`text-xs p-3 rounded-xl border ${recovery.can_discharge
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                            : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                            }`}>
                            {recovery.can_discharge ? "✅ Patient can be discharged" : "⏳ Not yet recovered"}
                        </div>
                    )}
                </div>

                {/* Center - Body Diagram */}
                <div>
                    <GlassCard className="p-5 h-full flex flex-col">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Systemic Analysis</h3>
                        <div className="flex-1 flex items-center justify-center">
                            <BodyDiagram disease={patient.disease} className="w-full max-w-[280px]" />
                        </div>
                    </GlassCard>
                </div>

                {/* Right - Vitals */}
                <div className="space-y-4">
                    <GlassCard className="p-5">
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Live Vitals</h3>

                        {/* ECG */}
                        <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="text-xs text-white/40">ECG Waveform</span>
                                {latestVital?.is_anomaly && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-auto" />
                                )}
                            </div>
                            <ECGWaveform data={ecgData} width={320} height={80} color={latestVital?.is_anomaly ? "#ef4444" : "#06b6d4"} />
                        </div>

                        {/* Vitals Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Heart className="w-3 h-3 text-red-400" />
                                    <span className="text-[10px] text-white/30">Heart Rate</span>
                                </div>
                                <span className="text-lg font-bold text-red-400">{latestVital?.heart_rate || "—"}</span>
                                <span className="text-xs text-white/30 ml-1">bpm</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Droplets className="w-3 h-3 text-cyan-400" />
                                    <span className="text-[10px] text-white/30">SpO2</span>
                                </div>
                                <span className="text-lg font-bold text-cyan-400">{latestVital?.spo2 || "—"}</span>
                                <span className="text-xs text-white/30 ml-1">%</span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Activity className="w-3 h-3 text-purple-400" />
                                    <span className="text-[10px] text-white/30">Blood Pressure</span>
                                </div>
                                <span className="text-lg font-bold text-purple-400">
                                    {latestVital?.blood_pressure ? `${latestVital.blood_pressure.systolic}/${latestVital.blood_pressure.diastolic}` : "—"}
                                </span>
                            </div>
                            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Thermometer className="w-3 h-3 text-orange-400" />
                                    <span className="text-[10px] text-white/30">Temperature</span>
                                </div>
                                <span className="text-lg font-bold text-orange-400">{latestVital?.temperature || "—"}</span>
                                <span className="text-xs text-white/30 ml-1">°C</span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Anomaly Status */}
                    <GlassCard className="p-4">
                        <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${latestVital?.is_anomaly
                                ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                }`} />
                            <div>
                                <p className="text-sm font-semibold">{latestVital?.is_anomaly ? "Anomaly Detected" : "Normal"}</p>
                                <p className="text-xs text-white/30">ML confidence: {latestVital?.anomaly_score ? `${(latestVital.anomaly_score * 100).toFixed(1)}%` : "N/A"}</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* ═══ MEDICATION CALENDAR ═══ */}
            <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Medication Schedule</h3>
                    </div>
                    {isToday && pendingCount > 0 && (
                        <button onClick={handleMarkAll} disabled={markingAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                            {markingAll ? <Spinner size={12} /> : <CheckCheck className="w-3.5 h-3.5" />}
                            Mark All Taken
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-5">
                    {/* Calendar Picker */}
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <MiniCalendar selectedDate={medCalDate} onSelect={setMedCalDate} />
                    </div>

                    {/* Medications List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-white/40 font-medium">
                                {medCalDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                            </p>
                            {isToday && <span className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Today</span>}
                        </div>

                        {loadingMeds ? (
                            <div className="py-8 text-center"><Spinner size={20} /></div>
                        ) : medsForDate.length > 0 ? (
                            <div className="space-y-2">
                                {medsForDate.map((m, i) => {
                                    const medName = m.medication_name || m.medicine_name || "Medication";
                                    const isTaken = m._displayStatus === "taken";
                                    const isMissed = m._displayStatus === "missed";
                                    const isPending = !isTaken && !isMissed;
                                    return (
                                        <motion.div key={i}
                                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isTaken
                                                ? "bg-emerald-500/[0.04] border-emerald-500/10"
                                                : isMissed ? "bg-red-500/[0.04] border-red-500/10"
                                                    : "bg-white/[0.02] border-white/[0.04]"}`}>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isTaken ? "bg-emerald-500/15 text-emerald-400"
                                                : isMissed ? "bg-red-500/15 text-red-400"
                                                    : "bg-white/[0.04] text-white/20"}`}>
                                                {isTaken ? <CheckCircle2 className="w-4 h-4" /> : isMissed ? <XCircle className="w-4 h-4" /> : <Pill className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isTaken ? "text-emerald-400/70 line-through" : "text-white/60"}`}>{medName}</p>
                                                <p className="text-[10px] text-white/20">{m.schedule || "Daily"}</p>
                                            </div>
                                            {isToday && isPending && (
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    <button onClick={() => handleMark(m, "taken")} disabled={marking === medName}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[11px] font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-50">
                                                        {marking === medName ? <Spinner size={10} /> : <CheckCircle2 className="w-3 h-3" />}
                                                        Taken
                                                    </button>
                                                    <button onClick={() => handleMark(m, "missed")} disabled={marking === medName}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/15 text-red-400 text-[11px] font-medium hover:bg-red-500/20 transition-all disabled:opacity-50">
                                                        <XCircle className="w-3 h-3" />
                                                        Missed
                                                    </button>
                                                </div>
                                            )}
                                            {(isTaken || isMissed) && (
                                                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium flex-shrink-0 ${isTaken
                                                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/15"
                                                    : "text-red-400 bg-red-500/10 border-red-500/15"}`}>
                                                    {isTaken ? "✓ Taken" : "✗ Missed"}
                                                </span>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Pill className="w-6 h-6 text-white/10 mx-auto mb-2" />
                                <p className="text-xs text-white/20">No medications found</p>
                            </div>
                        )}
                    </div>
                </div>
            </GlassCard>
        </div>
    );
}
