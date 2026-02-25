"use client";
import { useEffect, useState } from "react";

interface Props {
    value: number;        // 0-100
    size?: number;        // px
    strokeWidth?: number;
    color?: string;
    label?: string;
    suffix?: string;
}

export default function CircularGauge({
    value, size = 120, strokeWidth = 8, color = "#06b6d4", label, suffix = "%"
}: Props) {
    const [animated, setAnimated] = useState(0);
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (animated / 100) * circ;

    useEffect(() => {
        const t = setTimeout(() => setAnimated(value), 100);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative" style={{ width: size, height: size }}>
                <svg width={size} height={size} className="-rotate-90">
                    {/* Track */}
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
                    {/* Value */}
                    <circle cx={size / 2} cy={size / 2} r={r}
                        fill="none" stroke={color} strokeWidth={strokeWidth}
                        strokeDasharray={circ} strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                        style={{
                            filter: `drop-shadow(0 0 6px ${color}80)`,
                        }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold" style={{ color }}>{Math.round(animated)}{suffix}</span>
                </div>
            </div>
            {label && <span className="text-xs text-white/40 uppercase tracking-wider">{label}</span>}
        </div>
    );
}
