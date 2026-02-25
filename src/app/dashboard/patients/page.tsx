"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, UserCheck, UserX, Plus, X } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import { LoadingOverlay, Spinner } from "@/components/ui/Loading";
import { getPatients, getLifecycleStats, dischargePatient, createPatient } from "@/lib/api";

const NAMES = ["Arjun Patel", "Priya Sharma", "Rahul Kumar", "Ananya Gupta", "Vikram Singh", "Meera Reddy", "Karan Joshi", "Neha Verma", "Sanjay Mehta", "Pooja Nair", "Amit Saxena", "Divya Iyer"];
const DISEASES = ["Diabetes", "Hypertension", "COPD", "Asthma", "Heart Failure", "Pneumonia", "Anemia", "Chronic Kidney Disease", "Tuberculosis", "Dengue Fever"];
const GENDERS = ["Male", "Female", "Other"];

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<any[]>([]);
    const [lifecycle, setLifecycle] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showDischarged, setShowDischarged] = useState(false);
    const [discharging, setDischarging] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [adding, setAdding] = useState(false);
    const [formData, setFormData] = useState({ name: "", age: "", gender: "Male", disease: "Diabetes" });

    const load = async () => {
        setLoading(true);
        try {
            const [pRes, lcRes] = await Promise.all([
                getPatients(showDischarged),
                getLifecycleStats(),
            ]);
            const pts = (pRes.data || []).map((p: any, i: number) => ({
                ...p,
                name: p.name && p.name !== "Patient" ? p.name : NAMES[i % NAMES.length],
            }));
            setPatients(pts);
            if (lcRes.data) setLifecycle(lcRes.data);
        } catch {
            setPatients([]);
        }
        setLoading(false);
    };

    useEffect(() => { load(); }, [showDischarged]);

    const filtered = useMemo(() => {
        if (!search) return patients;
        const q = search.toLowerCase();
        return patients.filter((p) =>
            (p.name || "").toLowerCase().includes(q) ||
            (p.disease || "").toLowerCase().includes(q) ||
            (p.patient_id || "").toLowerCase().includes(q)
        );
    }, [patients, search]);

    const handleDischarge = async (pid: string) => {
        setDischarging(pid);
        try {
            await dischargePatient(pid);
            await load();
        } catch { alert("Discharge failed — API offline."); }
        setDischarging(null);
    };

    const handleAddPatient = async () => {
        if (!formData.name || !formData.age) return;
        setAdding(true);
        try {
            await createPatient({
                name: formData.name,
                age: parseInt(formData.age),
                gender: formData.gender,
                disease: formData.disease,
            });
            setFormData({ name: "", age: "", gender: "Male", disease: "Diabetes" });
            setShowAddForm(false);
            await load();
        } catch {
            alert("Failed to add patient — API offline.");
        }
        setAdding(false);
    };

    if (loading) return <LoadingOverlay message="Loading patients..." />;

    const active = lifecycle.currently_active || patients.filter((p) => p.status === "admitted").length;
    const discharged = lifecycle.discharged || patients.filter((p) => p.status === "discharged").length;
    const recoveryRate = lifecycle.recovery_rate_percent ?? 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/20 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight font-display">Patients</h1>
                        <p className="text-xs text-white/30 mt-0.5">{filtered.length} records</p>
                    </div>
                </div>
                <button onClick={() => setShowAddForm(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all">
                    <Plus className="w-4 h-4" />
                    Add Patient
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard icon={<Users className="w-5 h-5" />} label="Total" value={patients.length} glowColor="#3b82f6" />
                <StatCard icon={<UserCheck className="w-5 h-5" />} label="Active" value={active} glowColor="#10b981" />
                <StatCard icon={<UserX className="w-5 h-5" />} label="Discharged" value={discharged} glowColor="#8b5cf6" />
                <StatCard icon="📊" label="Recovery Rate" value={`${recoveryRate.toFixed?.(1) || recoveryRate}%`} glowColor="#06b6d4" />
            </div>

            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search patients, diseases..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-colors" />
                </div>
                <button onClick={() => setShowDischarged(!showDischarged)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${showDischarged
                        ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
                        : "bg-white/[0.03] border border-white/[0.06] text-white/40 hover:text-white/60"}`}>
                    <UserX className="w-3.5 h-3.5" />
                    {showDischarged ? "Showing Discharged" : "Show Discharged"}
                </button>
            </div>

            <GlassCard className="overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/[0.06]">
                            {["Patient", "Disease", "Age", "Status", "Admitted", ""].map((h) => (
                                <th key={h} className="text-left px-5 py-3 text-[10px] text-white/25 uppercase tracking-wider font-medium">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((p, i) => {
                            const isDischarged = p.status === "discharged";
                            return (
                                <motion.tr key={p.patient_id || i}
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: Math.min(i * 0.02, 0.4) }}
                                    onClick={() => p.patient_id && router.push(`/dashboard/patients/${p.patient_id}`)}
                                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                                >
                                    <td className="px-5 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-white/[0.08]"
                                                style={{ background: `linear-gradient(135deg, ${isDischarged ? "#a855f720" : "#3b82f620"}, transparent)` }}>
                                                {p.name?.[0] || "P"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{p.name}</p>
                                                <p className="text-[10px] text-white/20 font-mono">{p.patient_id?.slice(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3 text-white/40">{p.disease || "—"}</td>
                                    <td className="px-5 py-3 text-white/40">{p.age || "—"}</td>
                                    <td className="px-5 py-3">
                                        {isDischarged ? (
                                            <div>
                                                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                                                    ✓ Recovered
                                                </span>
                                                {p.discharge_timestamp && (
                                                    <p className="text-[9px] text-white/15 mt-1">
                                                        {new Date(p.discharge_timestamp).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/15">
                                                Admitted
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-5 py-3 text-white/25 text-xs">
                                        {p.admission_timestamp ? new Date(p.admission_timestamp).toLocaleDateString() : "—"}
                                    </td>
                                    <td className="px-5 py-3">
                                        {!isDischarged && (
                                            <button onClick={(e) => { e.stopPropagation(); handleDischarge(p.patient_id); }}
                                                disabled={discharging === p.patient_id}
                                                className="text-[10px] px-2 py-1 rounded-md bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all disabled:opacity-50">
                                                {discharging === p.patient_id ? "..." : "Discharge"}
                                            </button>
                                        )}
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </GlassCard>

            {/* ═══ ADD PATIENT MODAL ═══ */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowAddForm(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative w-full max-w-md mx-4 p-6 rounded-2xl bg-gradient-to-br from-[#141828] to-[#0d1020] border border-white/[0.08] shadow-2xl shadow-black/40">
                            <button onClick={() => setShowAddForm(false)}
                                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/[0.06] text-white/30 hover:text-white/60 transition-all">
                                <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/20 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Add New Patient</h3>
                                    <p className="text-[11px] text-white/30">Auto-generates meds, bed, vitals & anomaly check</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Patient Name</label>
                                    <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Prakhar Sharma"
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-cyan-500/30 transition-colors" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Age</label>
                                        <input type="number" min={1} max={120} value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                            placeholder="22"
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 placeholder:text-white/15 focus:outline-none focus:border-cyan-500/30 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Gender</label>
                                        <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-500/30 transition-colors appearance-none">
                                            {GENDERS.map((g) => <option key={g} value={g} className="bg-[#141828]">{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-white/30 uppercase tracking-wider block mb-1.5">Disease / Condition</label>
                                    <select value={formData.disease} onChange={(e) => setFormData({ ...formData, disease: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/70 focus:outline-none focus:border-cyan-500/30 transition-colors appearance-none">
                                        {DISEASES.map((d) => <option key={d} value={d} className="bg-[#141828]">{d}</option>)}
                                    </select>
                                </div>

                                <button onClick={handleAddPatient} disabled={adding || !formData.name || !formData.age}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all disabled:opacity-50 mt-2">
                                    {adding ? <Spinner size={16} color="white" /> : <Plus className="w-4 h-4" />}
                                    {adding ? "Creating Patient..." : "Add Patient"}
                                </button>

                                <p className="text-[10px] text-white/15 text-center">Backend auto-generates medications, bed assignment, initial vitals & anomaly check</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
