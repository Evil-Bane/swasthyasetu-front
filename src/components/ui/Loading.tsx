"use client";
import { motion } from "framer-motion";

/* ── Page-level loading skeleton ── */
export function PageSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/[0.04]" />
                <div className="space-y-2">
                    <div className="w-40 h-5 rounded-lg bg-white/[0.04]" />
                    <div className="w-24 h-3 rounded-lg bg-white/[0.03]" />
                </div>
            </div>
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
                ))}
            </div>
            {/* Content skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-64 rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
                <div className="h-64 rounded-2xl bg-white/[0.03] border border-white/[0.04]" />
            </div>
        </div>
    );
}

/* ── Inline spinner for buttons and small areas ── */
export function Spinner({ size = 16, color = "#06b6d4" }: { size?: number; color?: string }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="animate-spin">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.15" />
            <path d="M12 2a10 10 0 019.95 9" stroke={color} strokeWidth="3" strokeLinecap="round" />
        </svg>
    );
}

/* ── Full-page loading overlay with pulse animation ── */
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-[60vh] gap-4"
        >
            <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 border border-cyan-500/15 flex items-center justify-center">
                    <Spinner size={20} />
                </div>
                <motion.div
                    className="absolute -inset-2 rounded-2xl border border-cyan-500/10"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </div>
            <p className="text-xs text-white/25 tracking-wider uppercase">{message}</p>
        </motion.div>
    );
}

/* ── Table row skeleton ── */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
    return (
        <div className="animate-pulse">
            {[...Array(rows)].map((_, r) => (
                <div key={r} className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.03]">
                    {[...Array(cols)].map((_, c) => (
                        <div key={c} className="flex-1 h-3.5 rounded bg-white/[0.03]" style={{ maxWidth: c === 0 ? 120 : c === cols - 1 ? 60 : 80 }} />
                    ))}
                </div>
            ))}
        </div>
    );
}
