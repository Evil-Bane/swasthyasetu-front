"use client";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { FileText, Download, User, Search } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { LoadingOverlay, Spinner } from "@/components/ui/Loading";
import { getPatients, downloadReport } from "@/lib/api";

const NAMES = ["Arjun Patel", "Priya Sharma", "Rahul Kumar", "Ananya Gupta", "Vikram Singh", "Meera Reddy", "Karan Joshi", "Neha Verma"];

const DEMO_PATIENTS = [
    { patient_id: "d1", name: "Arjun Patel", age: 45, disease: "Hypertension", status: "admitted" },
    { patient_id: "d2", name: "Priya Sharma", age: 32, disease: "Diabetes", status: "admitted" },
    { patient_id: "d3", name: "Rahul Kumar", age: 58, disease: "COPD", status: "admitted" },
    { patient_id: "d4", name: "Ananya Gupta", age: 27, disease: "Asthma", status: "admitted" },
    { patient_id: "d5", name: "Vikram Singh", age: 61, disease: "Heart Failure", status: "admitted" },
];

export default function ReportsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [downloading, setDownloading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await getPatients();
                const pts = (res.data || []).map((p: any, i: number) => ({
                    ...p,
                    name: p.name && p.name !== "Patient" ? p.name : NAMES[i % NAMES.length],
                }));
                setPatients(pts.length ? pts : DEMO_PATIENTS);
            } catch { setPatients(DEMO_PATIENTS); }
            setLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        if (!search) return patients;
        const q = search.toLowerCase();
        return patients.filter((p) =>
            (p.name || "").toLowerCase().includes(q) ||
            (p.disease || "").toLowerCase().includes(q) ||
            (p.patient_id || "").toLowerCase().includes(q)
        );
    }, [patients, search]);

    const handleDownload = async () => {
        if (!selected) return;
        setDownloading(true);
        try { await downloadReport(selected.patient_id); } catch { alert("Report download unavailable — API offline."); }
        setDownloading(false);
    };

    if (loading) return <LoadingOverlay message="Loading reports..." />;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight font-display">Reports</h1>
                    <p className="text-xs text-white/30 mt-0.5">Generate PDF health reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <GlassCard className="p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Select Patient</h3>
                        <span className="text-[10px] text-white/20">{filtered.length} patients</span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                        <input value={search} onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search patients, diseases..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors" />
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide">
                        {filtered.map((p) => (
                            <button key={p.patient_id} onClick={() => setSelected(p)}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-xl transition-all text-left ${selected?.patient_id === p.patient_id
                                    ? "bg-cyan-500/10 border border-cyan-500/20"
                                    : "bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04]"}`}>
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {p.name?.[0] || "P"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${selected?.patient_id === p.patient_id ? "text-cyan-400" : "text-white/60"}`}>{p.name}</p>
                                    <p className="text-[10px] text-white/25">{p.disease} • Age {p.age}</p>
                                </div>
                                {selected?.patient_id === p.patient_id && (
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
                                )}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-xs text-white/20 text-center py-8">No patients match your search</p>
                        )}
                    </div>
                </GlassCard>

                <div className="space-y-4">
                    <GlassCard className="p-6">
                        {selected ? (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-purple-500/15 border border-white/[0.06] flex items-center justify-center">
                                        <User className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold">{selected.name}</h3>
                                        <p className="text-xs text-white/30">{selected.disease} • Age {selected.age}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    {[
                                        { label: "Report Type", value: "Comprehensive Health Report" },
                                        { label: "Includes", value: "Vitals, Labs, Medications, ECG" },
                                        { label: "Format", value: "PDF" },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                                            <span className="text-xs text-white/30">{label}</span>
                                            <span className="text-xs text-white/50">{value}</span>
                                        </div>
                                    ))}
                                </div>

                                <button onClick={handleDownload} disabled={downloading}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50">
                                    {downloading ? <Spinner size={16} color="white" /> : <Download className="w-4 h-4" />}
                                    {downloading ? "Generating..." : "Download PDF Report"}
                                </button>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
                                    <FileText className="w-7 h-7 text-white/15" />
                                </div>
                                <p className="text-sm text-white/25">Select a patient to preview report</p>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
