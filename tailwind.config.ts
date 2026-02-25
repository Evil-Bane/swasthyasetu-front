import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["var(--font-inter)", "system-ui", "sans-serif"],
                display: ["var(--font-space)", "system-ui", "sans-serif"],
                mono: ["var(--font-orbitron)", "monospace"],
            },
            colors: {
                surface: {
                    DEFAULT: "#050505",
                    secondary: "#0a0a0a",
                    card: "rgba(255, 255, 255, 0.03)",
                },
                accent: {
                    orange: "#f97316",
                    ember: "#fb923c",
                    emerald: "#10b981",
                    purple: "#a855f7",
                    cyan: "#06b6d4",
                },
            },
            animation: {
                "pulse-glow": "pulseGlow 2s ease-in-out infinite",
                "ecg-sweep": "ecgSweep 3s linear infinite",
                "fade-up": "fadeUp 0.5s ease-out forwards",
            },
            keyframes: {
                pulseGlow: {
                    "0%, 100%": { boxShadow: "0 0 8px rgba(6,182,212,0.2)" },
                    "50%": { boxShadow: "0 0 20px rgba(6,182,212,0.4)" },
                },
                ecgSweep: {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(100%)" },
                },
                fadeUp: {
                    "0%": { opacity: "0", transform: "translateY(20px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};

export default config;
