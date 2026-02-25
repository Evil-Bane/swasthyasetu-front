"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════
   SwasthyaScroll — Pure Cinematic Intro (GPU-Optimised)
   
   ✅ No blur filters (causes compositing overhead)
   ✅ will-change: transform for GPU layers
   ✅ Scrollbar hidden during intro
   ✅ Minimal particles (opacity only, no blur)
   ✅ rAF render loop with frame interpolation
   ✅ Auto-redirect to /dashboard on scroll completion
   ═══════════════════════════════════════════════════════════ */

const FRAME_COUNT = 241;
const framePath = (i: number) =>
    `/frames/frame-${String(i).padStart(4, "0")}.webp`;

const BG = "#0a0e1a";

/* ── Ambient particles — fewer, no blur, GPU-composited ── */
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
    id: i,
    size: 1 + Math.random() * 2,
    x: 5 + Math.random() * 90,
    y: 10 + Math.random() * 80,
    delay: Math.random() * 6,
    duration: 14 + Math.random() * 16,
    opacity: 0.06 + Math.random() * 0.12,
}));

export default function SwasthyaScroll() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imagesRef = useRef<HTMLImageElement[]>([]);
    const currentFrameRef = useRef(0);
    const targetFrameRef = useRef(0);
    const rafRef = useRef<number>(0);
    const progressRef = useRef<HTMLDivElement>(null);
    const hasRedirected = useRef(false);
    const router = useRouter();

    const [loaded, setLoaded] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    /* ── Hide scrollbar when scroll section is active ── */
    useEffect(() => {
        document.documentElement.classList.add("scroll-intro-active");
        return () => {
            document.documentElement.classList.remove("scroll-intro-active");
        };
    }, []);

    /* ── Cover-fit draw — no extra filters ── */
    const drawFrame = useCallback((index: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: false });
        const img = imagesRef.current[index];
        if (!ctx || !img || !img.complete) return;

        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        ctx.fillStyle = BG;
        ctx.fillRect(0, 0, cw, ch);
        ctx.drawImage(img, dx, dy, dw, dh);
    }, []);

    /* ── Smooth rAF render loop with interpolation ── */
    const startRenderLoop = useCallback(() => {
        const tick = () => {
            const target = targetFrameRef.current;
            const current = currentFrameRef.current;
            if (current !== target) {
                // Smooth frame interpolation (lerp 30%)
                const next = current + (target - current) * 0.3;
                const rounded = Math.round(next);
                if (rounded !== current) {
                    currentFrameRef.current = rounded;
                    drawFrame(rounded);
                }
            }
            rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
    }, [drawFrame]);

    /* ── Resize ── */
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        drawFrame(currentFrameRef.current);
    }, [drawFrame]);

    /* ── Preload 241 WebP frames ── */
    useEffect(() => {
        let count = 0;
        const images: HTMLImageElement[] = [];
        for (let i = 1; i <= FRAME_COUNT; i++) {
            const img = new Image();
            img.src = framePath(i);
            img.onload = () => {
                count++;
                setLoadProgress(Math.round((count / FRAME_COUNT) * 100));
                if (count === FRAME_COUNT) {
                    imagesRef.current = images;
                    setLoaded(true);
                }
            };
            img.onerror = () => {
                count++;
                if (count === FRAME_COUNT) {
                    imagesRef.current = images;
                    setLoaded(true);
                }
            };
            images[i - 1] = img;
        }
    }, []);

    /* ── GSAP + Lenis init ── */
    useEffect(() => {
        if (!loaded) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        drawFrame(0);
        startRenderLoop();

        let cleanup: (() => void) | undefined;

        (async () => {
            const gsapModule = await import("gsap");
            const { ScrollTrigger } = await import("gsap/ScrollTrigger");
            const { default: Lenis } = await import("lenis");

            const gsap = gsapModule.default;
            gsap.registerPlugin(ScrollTrigger);

            const lenis = new Lenis({
                duration: 2.0,
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                orientation: "vertical",
                gestureOrientation: "vertical",
                smoothWheel: true,
                wheelMultiplier: 0.6,
                touchMultiplier: 1.2,
            });

            lenis.on("scroll", ScrollTrigger.update);
            gsap.ticker.add((time: number) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);

            /* ── Frame sequencer ── */
            const frameObj = { frame: 0 };
            gsap.to(frameObj, {
                frame: FRAME_COUNT - 1,
                snap: "frame",
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top top",
                    end: "bottom bottom",
                    scrub: 1.0,
                    onUpdate: (self) => {
                        targetFrameRef.current = Math.round(frameObj.frame);
                        // Cinematic transition to dashboard when scroll hits 98%
                        if (self.progress >= 0.98 && !hasRedirected.current) {
                            hasRedirected.current = true;
                            document.documentElement.classList.remove("scroll-intro-active");
                            setTransitioning(true);
                            setTimeout(() => router.push("/dashboard"), 1200);
                        }
                    },
                },
            });

            /* ── Progress bar ── */
            const progressBar = progressRef.current;
            if (progressBar) {
                gsap.to(progressBar, {
                    scaleY: 1,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top top",
                        end: "bottom bottom",
                        scrub: 0.1,
                    },
                });

                gsap.to(progressBar.parentElement, {
                    opacity: 0,
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "90% top",
                        end: "96% top",
                        scrub: true,
                    },
                });
            }

            cleanup = () => {
                lenis.destroy();
                ScrollTrigger.getAll().forEach((t) => t.kill());
            };
        })();

        window.addEventListener("resize", resizeCanvas);
        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener("resize", resizeCanvas);
            cleanup?.();
        };
    }, [loaded, drawFrame, startRenderLoop, resizeCanvas, router]);

    /* ═══════ LOADING SCREEN ═══════ */
    if (!loaded) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a0e1a]">
                <div className="flex flex-col items-center gap-8">
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </div>
                        <motion.div
                            className="absolute -inset-2 rounded-3xl border border-cyan-500/20"
                            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    <motion.span
                        className="text-lg font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        SwasthyaSetu
                    </motion.span>

                    <div className="w-48 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: `${loadProgress}%` }}
                            transition={{ ease: "easeOut", duration: 0.15 }}
                        />
                    </div>

                    <motion.p
                        className="text-[10px] text-white/20 tracking-[0.3em] uppercase"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Loading · {loadProgress}%
                    </motion.p>
                </div>
            </div>
        );
    }

    /* ═══════ SCROLL SECTION — PURE CINEMATIC ═══════ */
    return (
        <div ref={sectionRef} className="relative" style={{ height: "450vh" }}>
            {/* ── Sticky viewport — GPU layer ── */}
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden"
                style={{ background: BG, willChange: "transform", contain: "layout paint" }}>
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full"
                    style={{ willChange: "contents" }}
                />

                {/* ── Cinematic vignette — CSS gradient, no blur ── */}
                <div className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `radial-gradient(ellipse 80% 70% at 50% 50%, transparent 50%, rgba(10,14,26,0.6) 100%)`,
                    }} />

                {/* ── Edge glows — simple opacity gradients, no blur ── */}
                <div className="absolute top-0 left-0 w-1/4 h-full pointer-events-none"
                    style={{ background: "linear-gradient(90deg, rgba(6,182,212,0.03), transparent)" }} />
                <div className="absolute top-0 right-0 w-1/4 h-full pointer-events-none"
                    style={{ background: "linear-gradient(270deg, rgba(168,85,247,0.03), transparent)" }} />

                {/* ── Bottom gradient bridge ── */}
                <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
                    style={{ background: "linear-gradient(to top, #0a0e1a, transparent)" }} />

                {/* ── Particles — pure opacity, no blur, GPU transformed ── */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {PARTICLES.map((p) => (
                        <div
                            key={p.id}
                            className="absolute rounded-full bg-white particle-float"
                            style={{
                                width: p.size,
                                height: p.size,
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                opacity: p.opacity,
                                transform: "translateZ(0)",
                                ["--duration" as any]: `${p.duration}s`,
                                ["--delay" as any]: `${p.delay}s`,
                                ["--p-opacity" as any]: p.opacity,
                            }}
                        />
                    ))}
                </div>

                {/* ── Scroll progress indicator ── */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 h-24 w-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                        ref={progressRef}
                        className="w-full h-full bg-gradient-to-b from-cyan-500 to-emerald-400 rounded-full origin-top"
                        style={{ transform: "scaleY(0)" }}
                    />
                </div>

                {/* ── Scroll cue ── */}
                <div className="scroll-cue absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                    <motion.div
                        animate={{ y: [0, 6, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg className="w-4 h-4 text-cyan-500/50" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M19 9l-7 7-7-7" />
                        </svg>
                    </motion.div>
                </div>

                {/* ═══ CINEMATIC TRANSITION OVERLAY ═══ */}
                {transitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute inset-0 z-[100] flex flex-col items-center justify-center"
                        style={{ background: "radial-gradient(ellipse at center, #0d1225 0%, #0a0e1a 100%)" }}
                    >
                        {/* Expanding ring */}
                        <motion.div
                            initial={{ scale: 0, opacity: 0.6 }}
                            animate={{ scale: 4, opacity: 0 }}
                            transition={{ duration: 1.4, ease: "easeOut" }}
                            className="absolute w-32 h-32 rounded-full border border-cyan-500/30"
                        />
                        <motion.div
                            initial={{ scale: 0, opacity: 0.4 }}
                            animate={{ scale: 6, opacity: 0 }}
                            transition={{ duration: 1.6, ease: "easeOut", delay: 0.1 }}
                            className="absolute w-32 h-32 rounded-full border border-emerald-500/20"
                        />

                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-cyan-500/30 mb-6"
                        >
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                        </motion.div>

                        {/* Text */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="text-sm font-semibold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent"
                        >
                            Entering Dashboard
                        </motion.p>

                        {/* Loading dots */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="flex gap-1 mt-4"
                        >
                            {[0, 1, 2].map(i => (
                                <motion.div key={i}
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
