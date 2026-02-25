"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Bell, X, Volume2 } from "lucide-react";
import { getAlerts } from "@/lib/api";

interface AlertToast {
    id: string;
    severity: string;
    message: string;
    patient_name?: string;
    rule?: string;
    timestamp: number;
}

const SEVERITY_STYLES: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    critical: { bg: "from-red-500/15 to-red-900/10", border: "border-red-500/30", icon: "text-red-400", text: "text-red-300" },
    high: { bg: "from-orange-500/15 to-orange-900/10", border: "border-orange-500/30", icon: "text-orange-400", text: "text-orange-300" },
    medium: { bg: "from-amber-500/15 to-amber-900/10", border: "border-amber-500/30", icon: "text-amber-400", text: "text-amber-300" },
    low: { bg: "from-blue-500/15 to-blue-900/10", border: "border-blue-500/30", icon: "text-blue-400", text: "text-blue-300" },
};

export default function AlertNotificationSystem() {
    const [toasts, setToasts] = useState<AlertToast[]>([]);
    const [enabled, setEnabled] = useState(true);
    const knownIdsRef = useRef<Set<string>>(new Set());
    const pollRef = useRef<NodeJS.Timeout | null>(null);

    const dismissToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    /* Auto-dismiss after 8 seconds */
    useEffect(() => {
        const timers = toasts.map(t =>
            setTimeout(() => dismissToast(t.id), 8000)
        );
        return () => timers.forEach(clearTimeout);
    }, [toasts, dismissToast]);

    /* Poll for new alerts every 15 seconds */
    useEffect(() => {
        if (!enabled) return;

        const check = async () => {
            try {
                const res = await getAlerts({ status: "active", limit: 5 });
                const alerts = res.data || [];

                const newAlerts: AlertToast[] = [];
                alerts.forEach((a: any) => {
                    const id = a.alert_id || a._id || `${a.patient_id}-${a.message}`;
                    if (!knownIdsRef.current.has(id)) {
                        knownIdsRef.current.add(id);
                        newAlerts.push({
                            id,
                            severity: a.severity || "medium",
                            message: a.message || "New alert triggered",
                            patient_name: a.patient_name,
                            rule: a.triggered_rule || a.rule,
                            timestamp: Date.now(),
                        });
                    }
                });

                if (newAlerts.length > 0) {
                    setToasts(prev => [...newAlerts.slice(0, 3), ...prev].slice(0, 5));
                }
            } catch { /* silent */ }
        };

        // Initial fill of known IDs (don't show toasts for existing alerts)
        (async () => {
            try {
                const res = await getAlerts({ status: "active", limit: 20 });
                (res.data || []).forEach((a: any) => {
                    const id = a.alert_id || a._id || `${a.patient_id}-${a.message}`;
                    knownIdsRef.current.add(id);
                });
            } catch { /* silent */ }
        })();

        // Start polling after 20s delay (don't spam on mount)
        const startDelay = setTimeout(() => {
            pollRef.current = setInterval(check, 15000);
        }, 20000);

        return () => {
            clearTimeout(startDelay);
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [enabled]);

    return (
        <>
            {/* Notification Bell / Toggle — shown fixed on top-right */}
            <button onClick={() => setEnabled(!enabled)}
                className={`fixed top-4 right-4 z-[60] w-9 h-9 rounded-xl flex items-center justify-center transition-all ${enabled
                    ? "bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 text-orange-400"
                    : "bg-white/[0.04] border border-white/[0.06] text-white/25"}`}>
                <Bell className="w-4 h-4" />
                {enabled && toasts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
                        {toasts.length}
                    </span>
                )}
            </button>

            {/* Toast Stack */}
            <div className="fixed top-16 right-4 z-[60] w-80 space-y-2 pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map((t) => {
                        const style = SEVERITY_STYLES[t.severity] || SEVERITY_STYLES.medium;
                        return (
                            <motion.div
                                key={t.id}
                                layout
                                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className={`pointer-events-auto relative rounded-xl bg-gradient-to-r ${style.bg} border ${style.border} backdrop-blur-xl p-3.5 shadow-xl shadow-black/30 cursor-pointer group`}
                                onClick={() => dismissToast(t.id)}
                            >
                                <button onClick={(e) => { e.stopPropagation(); dismissToast(t.id); }}
                                    className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/[0.06] text-white/20 hover:text-white/50 transition-all opacity-0 group-hover:opacity-100">
                                    <X className="w-3 h-3" />
                                </button>
                                <div className="flex items-start gap-2.5">
                                    <div className={`mt-0.5 ${style.icon}`}>
                                        <AlertTriangle className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase ${style.text} bg-white/[0.05]`}>
                                                {t.severity}
                                            </span>
                                            {t.patient_name && (
                                                <span className="text-[10px] text-white/30 truncate">{t.patient_name}</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-white/60 leading-relaxed line-clamp-2">{t.message}</p>
                                        {t.rule && (
                                            <p className="text-[10px] text-white/20 mt-1 font-mono truncate">Rule: {t.rule}</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </>
    );
}
