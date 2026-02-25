const BASE = "https://swasthyasetu-seven.vercel.app";

async function fetchJSON<T>(path: string, opts?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", ...opts?.headers },
    });
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
    return res.json();
}

async function fetchBlob(path: string): Promise<Blob> {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) throw new Error(`PDF ${res.status}`);
    return res.blob();
}

/* ── Dashboard ── */
export const getDashboard = () => fetchJSON<any>("/api/analytics/dashboard");

/* ── Patients ── */
export const getPatients = (includeDischarged = false) =>
    fetchJSON<any>(`/api/patients${includeDischarged ? "?include_discharged=true" : ""}`);
export const getPatient = (id: string) => fetchJSON<any>(`/api/patients/${id}`);
export const createPatient = (data: { name: string; age: number; gender: string; disease: string }) =>
    fetchJSON<any>("/api/patients/create", { method: "POST", body: JSON.stringify(data) });
export const generatePatients = (count: number) =>
    fetchJSON<any>("/api/patients/generate", { method: "POST", body: JSON.stringify({ count }) });

/* ── Vitals ── */
export const getLatestVitals = () => fetchJSON<any>("/api/vitals/latest");
export const getVitalHistory = (pid: string, limit = 50) =>
    fetchJSON<any>(`/api/vitals/${pid}?limit=${limit}`);
export const generateVitals = () =>
    fetchJSON<any>("/api/vitals/generate", { method: "POST" });

/* ── Alerts ── */
export const getAlerts = (params?: { status?: string; severity?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.severity) q.set("severity", params.severity);
    if (params?.limit) q.set("limit", String(params.limit));
    return fetchJSON<any>(`/api/alerts?${q}`);
};
export const getAlertStats = () => fetchJSON<any>("/api/alerts/stats");
export const acknowledgeAlert = (id: string) =>
    fetchJSON<any>(`/api/alerts/${id}/acknowledge`, { method: "PUT" });
export const resolveAlert = (id: string) =>
    fetchJSON<any>(`/api/alerts/${id}/resolve`, { method: "PUT" });

/* ── Medications ── */
export const getMedications = () => fetchJSON<any>("/api/medications");
export const getPatientMedications = (pid: string) => fetchJSON<any>(`/api/medications/${pid}`);
export const getMedicationStats = () => fetchJSON<any>("/api/medications/stats");
export const recordAdherence = (patientId: string, medicationId: string, action: "taken" | "missed") =>
    fetchJSON<any>("/api/medications/adherence", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, medication_id: medicationId, action }),
    });
export const markMedication = (patientId: string, medicineName: string, action: "taken" | "missed") =>
    fetchJSON<any>("/api/medications/mark", {
        method: "POST",
        body: JSON.stringify({ patient_id: patientId, medicine_name: medicineName, action }),
    });
export const markAllMedications = (patientId: string) =>
    fetchJSON<any>(`/api/medications/mark-all/${patientId}`, { method: "POST" });
export const simulateAdherence = () =>
    fetchJSON<any>("/api/medications/simulate", { method: "POST" });

/* ── Hospital ── */
export const getHospitalStats = () => fetchJSON<any>("/api/hospital/stats");
export const getHospitalBeds = () => fetchJSON<any>("/api/hospital/beds");
export const getICUBeds = () => fetchJSON<any>("/api/hospital/icu");
export const simulateOccupancy = () =>
    fetchJSON<any>("/api/hospital/simulate", { method: "POST" });

/* ── Analytics ── */
export const getVitalTrends = () => fetchJSON<any>("/api/analytics/trends");

/* ── Reports ── */
export const downloadReport = async (pid: string) => {
    const blob = await fetchBlob(`/api/reports/patient/${pid}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `patient_${pid}_report.pdf`;
    a.click();
    URL.revokeObjectURL(url);
};

/* ── Lifecycle ── */
export const getLifecycleStats = () => fetchJSON<any>("/api/lifecycle/stats");
export const checkRecovery = (pid: string) => fetchJSON<any>(`/api/lifecycle/recovery/${pid}`);
export const dischargePatient = (pid: string) =>
    fetchJSON<any>(`/api/lifecycle/discharge/${pid}`, { method: "POST" });
export const admitPatients = (count = 1) =>
    fetchJSON<any>(`/api/lifecycle/admit?count=${count}`, { method: "POST" });
