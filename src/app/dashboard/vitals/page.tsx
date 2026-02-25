"use client";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Radio } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import ECGWaveform from "@/components/vitals/ECGWaveform";
import { LoadingOverlay } from "@/components/ui/Loading";
import { getLatestVitals } from "@/lib/api";

const MAX_VISIBLE = 12;
const NAMES = ["Arjun Patel", "Priya Sharma", "Rahul Kumar", "Ananya Gupta", "Vikram Singh", "Meera Reddy", "Karan Joshi", "Neha Verma", "Sanjay Mehta", "Pooja Nair", "Amit Saxena", "Divya Iyer"];

const DEMO_VITALS = Array.from({ length: 8 }, (_, i) => ({
    patient_id: `demo-${i}`,
    patient_name: NAMES[i],
    heart_rate: 65 + Math.floor(Math.random() * 40),
    spo2: 94 + Math.floor(Math.random() * 6),
    blood_pressure: { systolic: 110 + Math.floor(Math.random() * 40), diastolic: 65 + Math.floor(Math.random() * 25) },
    temperature: +(36.2 + Math.random() * 1.8).toFixed(1),
    is_anomaly: i === 1 || i === 5,
    ecg_signal: Array.from({ length: 30 }, (_, j) => {
        const t = j / 30;
        return Math.sin(t * Math.PI * 4) * 25 + Math.sin(t * Math.PI * 12) * (i === 1 ? 40 : 10) + 50;
    }),
}));

/* ── Tiny fluctuation helpers ── */
const jitter = (val: number, range: number) => {
    const delta = (Math.random() - 0.5) * 2 * range;
    return Math.round(val + delta);
};
const jitterFloat = (val: number, range: number) => {
    const delta = (Math.random() - 0.5) * 2 * range;
    return +(val + delta).toFixed(1);
};

export default function VitalsPage() {
    const [baseVitals, setBaseVitals] = useState<any[]>([]);
    const [displayVitals, setDisplayVitals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCount, setShowCount] = useState(MAX_VISIBLE);
    const [isLive, setIsLive] = useState(true);
    const intervalsRef = useRef<NodeJS.Timeout[]>([]);
    const refreshRef = useRef<NodeJS.Timeout | null>(null);

    const fetchVitals = useCallback(async () => {
        try {
            const res = await getLatestVitals();
            const data = res.data || [];
            const mapped = data.length ? data.map((v: any, i: number) => ({
                ...v,
                patient_name: v.patient_name && v.patient_name !== "Patient" ? v.patient_name : NAMES[i % NAMES.length],
            })) : DEMO_VITALS;
            setBaseVitals(mapped);
            setDisplayVitals([...mapped]);
        } catch {
            setBaseVitals(DEMO_VITALS);
            setDisplayVitals([...DEMO_VITALS]);
        }
    }, []);

    /* ── Initial load ── */
    useEffect(() => {
        (async () => {
            setLoading(true);
            await fetchVitals();
            setLoading(false);
        })();
    }, [fetchVitals]);

    /* ── Live fluctuation: each patient gets a random 3-5s interval ── */
    useEffect(() => {
        if (!isLive || baseVitals.length === 0) return;

        // Clear old intervals
        intervalsRef.current.forEach(clearInterval);
        intervalsRef.current = [];

        baseVitals.forEach((_, idx) => {
            const delay = 3000 + Math.random() * 2000; // 3-5 seconds, random per patient
            const iv = setInterval(() => {
                setDisplayVitals(prev => {
                    const next = [...prev];
                    const base = baseVitals[idx];
                    if (!base || !next[idx]) return prev;
                    next[idx] = {
                        ...next[idx],
                        heart_rate: jitter(base.heart_rate, 2),       // ±2 bpm
                        spo2: jitter(base.spo2, 1),                    // ±1%
                        temperature: jitterFloat(base.temperature, 0.1), // ±0.1°C
                        blood_pressure: {
                            systolic: jitter(base.blood_pressure?.systolic || 120, 2),  // ±2
                            diastolic: jitter(base.blood_pressure?.diastolic || 80, 1), // ±1
                        },
                    };
                    return next;
                });
            }, delay);
            intervalsRef.current.push(iv);
        });

        return () => {
            intervalsRef.current.forEach(clearInterval);
            intervalsRef.current = [];
        };
    }, [baseVitals, isLive]);

    /* ── Full API refresh every 60 seconds ── */
    useEffect(() => {
        if (!isLive) return;
        refreshRef.current = setInterval(() => {
            fetchVitals();
        }, 60000);
        return () => { if (refreshRef.current) clearInterval(refreshRef.current); };
    }, [isLive, fetchVitals]);

    const visible = useMemo(() => displayVitals.slice(0, showCount), [displayVitals, showCount]);

    if (loading) return <LoadingOverlay message="Loading vitals..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-display">Vitals Monitor</h1>
                        <p className="text-xs text-white/30 mt-0.5">{displayVitals.length} patients • showing {Math.min(showCount, displayVitals.length)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isLive ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-white/20"}`} />
                    <span className="text-xs text-white/30">{isLive ? "LIVE" : "PAUSED"}</span>
                    <button onClick={() => setIsLive(!isLive)}
                        className={`ml-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${isLive
                            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                            : "bg-white/[0.03] border border-white/[0.06] text-white/30"}`}>
                        <Radio className="w-3 h-3 inline mr-1" />
                        {isLive ? "Live" : "Paused"}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {visible.map((v, i) => {
                    const ecgData = v.ecg_signal || Array.from({ length: 30 }, (_, j) => Math.sin(j * 0.5) * 20 + 50);
                    const isAnomaly = v.is_anomaly;
                    const name = v.patient_name || NAMES[i % NAMES.length];

                    return (
                        <motion.div key={v.patient_id || i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                            <GlassCard className={`p-4 ${isAnomaly ? "border-red-500/20" : ""}`} glowColor={isAnomaly ? "#ef4444" : undefined}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/[0.08]"
                                            style={{ background: `linear-gradient(135deg, ${isAnomaly ? "#ef444420" : "#06b6d420"}, transparent)` }}>
                                            {name[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold truncate max-w-[140px]">{name}</p>
                                            <p className="text-[10px] text-white/20 font-mono">{v.patient_id?.slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <span className={`w-2.5 h-2.5 rounded-full ${isAnomaly
                                        ? "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                        : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                        }`} />
                                </div>

                                <div className="rounded-lg bg-black/30 border border-white/[0.04] p-2 mb-3">
                                    <ECGWaveform data={ecgData} width={260} height={50}
                                        color={isAnomaly ? "#ef4444" : "#06b6d4"}
                                        animate={true}
                                        heartRate={v.heart_rate || 72}
                                        patientSeed={i * 7 + (v.patient_id?.charCodeAt(0) || 0)} />
                                </div>

                                <div className="grid grid-cols-4 gap-1.5">
                                    {[
                                        { label: "HR", value: v.heart_rate, color: "#ef4444" },
                                        { label: "SpO2", value: `${v.spo2}%`, color: "#06b6d4" },
                                        { label: "BP", value: `${v.blood_pressure?.systolic || "—"}/${v.blood_pressure?.diastolic || "—"}`, color: "#a855f7" },
                                        { label: "Temp", value: `${v.temperature}°`, color: "#f59e0b" },
                                    ].map((vital) => (
                                        <div key={vital.label} className="text-center p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                            <p className="text-[9px] mb-0.5 text-white/20">{vital.label}</p>
                                            <motion.p className="text-xs font-bold"
                                                key={String(vital.value)}
                                                initial={{ opacity: 0.6 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ color: vital.color }}>{vital.value}</motion.p>
                                        </div>
                                    ))}
                                </div>
                            </GlassCard>
                        </motion.div>
                    );
                })}
            </div>

            {showCount < displayVitals.length && (
                <div className="text-center pt-2">
                    <button onClick={() => setShowCount((c) => c + MAX_VISIBLE)}
                        className="px-6 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                        Show More ({displayVitals.length - showCount} remaining)
                    </button>
                </div>
            )}
        </div>
    );
}
