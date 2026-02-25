"use client";
import { useEffect, useRef, useCallback } from "react";

interface Props {
    data?: number[];
    width?: number;
    height?: number;
    color?: string;
    animate?: boolean;
    className?: string;
    heartRate?: number;
    patientSeed?: number;
}

/* Generate a unique ECG-like waveform based on seed */
function generateECGPattern(seed: number, length: number): number[] {
    const pts: number[] = [];
    const baseHR = 60 + (seed % 40); // 60-100 bpm variation
    const wavelength = Math.round(length / (baseHR / 20));
    const amplitude = 0.6 + (seed % 5) * 0.08;
    const noise = (seed % 7) * 0.015;

    for (let i = 0; i < length; i++) {
        const phase = (i % wavelength) / wavelength;
        let v = 0.5; // baseline

        // P wave (atrial depolarization)
        if (phase > 0.05 && phase < 0.15) {
            v += Math.sin((phase - 0.05) / 0.1 * Math.PI) * 0.12 * amplitude;
        }
        // QRS complex
        else if (phase > 0.18 && phase < 0.22) {
            v -= 0.08 * amplitude; // Q dip
        } else if (phase > 0.22 && phase < 0.28) {
            v += Math.sin((phase - 0.22) / 0.06 * Math.PI) * 0.45 * amplitude; // R peak
        } else if (phase > 0.28 && phase < 0.32) {
            v -= 0.15 * amplitude; // S dip
        }
        // T wave (ventricular repolarization)
        else if (phase > 0.38 && phase < 0.52) {
            v += Math.sin((phase - 0.38) / 0.14 * Math.PI) * 0.18 * amplitude;
        }

        // Per-patient noise
        v += Math.sin(i * 0.3 + seed) * noise;
        v += Math.sin(i * 0.7 + seed * 2) * noise * 0.5;

        pts.push(v);
    }
    return pts;
}

export default function ECGWaveform({
    data, width = 280, height = 60, color = "#06b6d4",
    animate = true, className = "", heartRate = 72, patientSeed = 0,
}: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const scrollRef = useRef(0);
    const animRef = useRef<number>(0);
    const patternsRef = useRef<number[]>([]);

    // Generate a unique pattern for each patient
    useEffect(() => {
        if (data && data.length > 5) {
            // Use provided data but extend it for continuous scroll
            const extended = [...data, ...data, ...data];
            patternsRef.current = extended;
        } else {
            patternsRef.current = generateECGPattern(patientSeed, 600);
        }
    }, [data, patientSeed]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const pts = patternsRef.current;
        if (!canvas || pts.length === 0) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const w = width;
        const h = height;

        ctx.clearRect(0, 0, w, h);

        // Dark grid lines (subtle)
        ctx.strokeStyle = "rgba(255,255,255,0.03)";
        ctx.lineWidth = 0.5;
        for (let y = 0; y < h; y += 12) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }
        for (let x = 0; x < w; x += 12) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }

        // Scrolling offset — speed based on heart rate
        const speed = (heartRate / 72) * 1.2;
        const offset = Math.floor(scrollRef.current * speed) % pts.length;

        // Build visible points
        const visiblePts: { x: number; y: number }[] = [];
        const pointCount = Math.min(pts.length, Math.floor(w / 2));
        const pad = 4;

        for (let i = 0; i < pointCount; i++) {
            const dataIdx = (offset + i) % pts.length;
            const x = (i / (pointCount - 1)) * w;
            const y = pad + (1 - pts[dataIdx]) * (h - pad * 2);
            visiblePts.push({ x, y });
        }

        // Glow effect line
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.6;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        ctx.beginPath();
        visiblePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.stroke();

        // Gradient fill underneath
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, `${color}18`);
        gradient.addColorStop(1, `${color}00`);
        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        visiblePts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fill();

        // Sweep line at leading edge
        if (animate) {
            const leadIdx = pointCount - 1;
            const lead = visiblePts[leadIdx];
            if (lead) {
                // Fade-out trail
                const fadePt = visiblePts[Math.max(0, leadIdx - 8)];
                if (fadePt) {
                    const fadeGrad = ctx.createLinearGradient(fadePt.x, 0, lead.x, 0);
                    fadeGrad.addColorStop(0, "transparent");
                    fadeGrad.addColorStop(1, `${color}40`);
                    ctx.fillStyle = fadeGrad;
                    ctx.fillRect(fadePt.x, 0, lead.x - fadePt.x, h);
                }

                // Glowing dot at tip
                ctx.beginPath();
                ctx.arc(lead.x, lead.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 12;
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }, [width, height, color, animate, heartRate]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.scale(dpr, dpr);

        if (!animate) {
            draw();
            return;
        }

        let lastTime = 0;
        const tick = (now: number) => {
            if (now - lastTime > 40) { // ~25fps for smooth scrolling
                scrollRef.current += 1;
                draw();
                lastTime = now;
            }
            animRef.current = requestAnimationFrame(tick);
        };

        animRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animRef.current);
    }, [draw, animate, width, height]);

    return (
        <canvas ref={canvasRef} className={className} style={{ width, height }} />
    );
}
