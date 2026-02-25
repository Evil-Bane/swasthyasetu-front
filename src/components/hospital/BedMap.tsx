"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Bed, ChevronRight } from "lucide-react";

interface BedData {
    bed_id: string;
    bed_type?: string;
    bed_label?: string;
    ward?: string;
    occupancy_status?: string;
    is_occupied?: boolean;
    patient_id?: string | null;
    patient_name?: string | null;
    disease?: string;
}

interface Props {
    beds: BedData[];
    filter?: string;
}

const TYPE_COLORS: Record<string, { border: string; bg: string; tag: string }> = {
    General: { border: "#06b6d4", bg: "rgba(6,182,212,0.06)", tag: "GEN" },
    general: { border: "#06b6d4", bg: "rgba(6,182,212,0.06)", tag: "GEN" },
    ICU: { border: "#8b5cf6", bg: "rgba(139,92,246,0.06)", tag: "ICU" },
    icu: { border: "#8b5cf6", bg: "rgba(139,92,246,0.06)", tag: "ICU" },
    Emergency: { border: "#ef4444", bg: "rgba(239,68,68,0.06)", tag: "EMR" },
    emergency: { border: "#ef4444", bg: "rgba(239,68,68,0.06)", tag: "EMR" },
};

const PATIENT_NAMES = ["Arjun Patel", "Priya Sharma", "Rahul Kumar", "Ananya Gupta", "Vikram Singh", "Meera Reddy", "Karan Joshi", "Neha Verma", "Sanjay Mehta", "Pooja Nair"];
const DISEASES = ["Hypertension", "Diabetes", "COPD", "Heart Failure", "Asthma", "Pneumonia", "Kidney Disease", "Bronchitis"];

export default function BedMap({ beds, filter }: Props) {
    const [selected, setSelected] = useState<BedData | null>(null);

    const filtered = filter && filter !== "All"
        ? beds.filter((b) => (b.bed_type || "").toLowerCase() === filter.toLowerCase())
        : beds;

    return (
        <>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {filtered.map((bed, idx) => {
                    const t = TYPE_COLORS[bed.bed_type || "General"] || TYPE_COLORS.General;
                    const occupied = bed.is_occupied || bed.occupancy_status === "occupied";
                    const label = bed.bed_label || bed.bed_id?.replace("bed-", "B-") || `B-${idx + 1}`;

                    return (
                        <motion.button
                            key={bed.bed_id || idx}
                            whileHover={{ scale: 1.08, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelected({ ...bed, patient_name: bed.patient_name || (occupied ? PATIENT_NAMES[idx % PATIENT_NAMES.length] : null), disease: bed.disease || (occupied ? DISEASES[idx % DISEASES.length] : undefined) })}
                            className="relative group focus:outline-none"
                        >
                            <div
                                className={`
                                    rounded-lg p-2 text-center transition-all duration-200 cursor-pointer
                                    border
                                    ${occupied ? "bg-white/[0.04]" : "bg-transparent"}
                                    hover:bg-white/[0.08] hover:border-opacity-80
                                `}
                                style={{
                                    borderColor: occupied ? `${t.border}50` : `${t.border}20`,
                                    boxShadow: occupied
                                        ? `0 0 12px ${t.border}15, inset 0 0 8px ${t.border}08`
                                        : "none",
                                }}
                            >
                                <span className="text-[8px] font-bold tracking-wider block"
                                    style={{ color: `${t.border}90` }}>
                                    {t.tag}
                                </span>
                                <span className="text-[10px] font-mono text-white/60 block mt-0.5">
                                    {label}
                                </span>
                                <div className="flex justify-center mt-1">
                                    <span
                                        className={`w-2 h-2 rounded-full ${!occupied ? "animate-pulse" : ""}`}
                                        style={{
                                            background: occupied ? "#f97316" : "#10b981",
                                            boxShadow: occupied
                                                ? "0 0 6px rgba(249,115,22,0.5)"
                                                : "0 0 6px rgba(16,185,129,0.5)",
                                        }}
                                    />
                                </div>
                            </div>
                            {/* Hover tooltip */}
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[9px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                {occupied ? "🟠 Occupied" : "🟢 Available"}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* ── Patient Detail Modal ── */}
            <AnimatePresence>
                {selected && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelected(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-sm mx-4 p-6 rounded-2xl bg-gradient-to-br from-[#141828] to-[#0d1020] border border-white/[0.08] shadow-2xl shadow-black/40"
                        >
                            <button onClick={() => setSelected(null)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center border border-white/[0.08]"
                                    style={{ background: `linear-gradient(135deg, ${(TYPE_COLORS[selected.bed_type || "General"] || TYPE_COLORS.General).border}20, transparent)` }}>
                                    <Bed className="w-5 h-5" style={{ color: (TYPE_COLORS[selected.bed_type || "General"] || TYPE_COLORS.General).border }} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">{selected.bed_label || selected.bed_id}</h3>
                                    <p className="text-[11px] text-white/30">{selected.ward || selected.bed_type || "General"} Ward</p>
                                </div>
                            </div>

                            {(selected.is_occupied || selected.occupancy_status === "occupied") && selected.patient_name ? (
                                <div className="space-y-3">
                                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center text-sm font-bold">
                                                {selected.patient_name[0]}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-white">{selected.patient_name}</p>
                                                <p className="text-[10px] text-white/25 font-mono">{selected.patient_id?.slice(0, 16) || "—"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {selected.disease && (
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                            <span className="text-xs text-white/30">Condition</span>
                                            <span className="text-xs font-medium text-white/60">{selected.disease}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-xs text-white/30">Room / Bed</span>
                                        <span className="text-xs font-medium text-white/60">{selected.bed_label || selected.bed_id}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-xs text-white/30">Ward</span>
                                        <span className="text-xs font-medium text-white/60">{selected.ward || selected.bed_type || "General"}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                                        <span className="text-xs text-white/30">Status</span>
                                        <span className="text-[10px] px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/15 font-medium">Occupied</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-lg">🟢</span>
                                    </div>
                                    <p className="text-sm font-medium text-emerald-400">Available</p>
                                    <p className="text-xs text-white/25 mt-1">This bed is ready for assignment</p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
