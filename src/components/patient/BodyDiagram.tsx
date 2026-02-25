"use client";

interface Props {
    disease: string;
    className?: string;
}

const ORGAN_HIGHLIGHTS: Record<string, { organs: string[]; color: string }> = {
    "Heart Failure": { organs: ["heart"], color: "#ef4444" },
    "Hypertension": { organs: ["vessels"], color: "#f43f5e" },
    "COPD": { organs: ["lungs"], color: "#3b82f6" },
    "Asthma": { organs: ["lungs"], color: "#60a5fa" },
    "Pneumonia": { organs: ["lungs"], color: "#2563eb" },
    "Tuberculosis": { organs: ["lungs"], color: "#1d4ed8" },
    "Diabetes": { organs: ["pancreas"], color: "#f97316" },
    "Chronic Kidney Disease": { organs: ["kidneys"], color: "#a855f7" },
    "Anemia": { organs: ["blood"], color: "#ec4899" },
    "Dengue Fever": { organs: ["blood"], color: "#f59e0b" },
};

export default function BodyDiagram({ disease, className = "" }: Props) {
    const highlight = ORGAN_HIGHLIGHTS[disease] || { organs: [], color: "#06b6d4" };
    const isActive = (organ: string) => highlight.organs.includes(organ);
    const glow = (organ: string) =>
        isActive(organ) ? `drop-shadow(0 0 8px ${highlight.color}) drop-shadow(0 0 16px ${highlight.color}60)` : "none";
    const fillColor = (organ: string) =>
        isActive(organ) ? highlight.color : "rgba(255,255,255,0.06)";
    const strokeColor = (organ: string) =>
        isActive(organ) ? highlight.color : "rgba(255,255,255,0.15)";

    return (
        <div className={`relative ${className}`}>
            <svg viewBox="0 0 200 440" className="w-full h-full max-w-[240px] mx-auto">
                <defs>
                    <filter id="neonGlow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <radialGradient id="bodyGrad" cx="50%" cy="30%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                    </radialGradient>
                </defs>

                {/* Body silhouette */}
                <g opacity="0.6">
                    {/* Head */}
                    <circle cx="100" cy="38" r="24" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    {/* Neck */}
                    <rect x="92" y="62" width="16" height="16" rx="4" fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                    {/* Torso */}
                    <path d="M60 78 Q60 76 70 76 L130 76 Q140 76 140 78 L145 200 Q145 210 135 212 L65 212 Q55 210 55 200 Z"
                        fill="url(#bodyGrad)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    {/* Left arm */}
                    <path d="M60 82 L30 130 L26 190 Q24 196 30 196 L36 196 Q40 196 40 190 L50 140 L60 100"
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                    {/* Right arm */}
                    <path d="M140 82 L170 130 L174 190 Q176 196 170 196 L164 196 Q160 196 160 190 L150 140 L140 100"
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" strokeLinecap="round" />
                    {/* Left leg */}
                    <path d="M75 210 L68 310 L64 400 Q62 410 72 410 L80 410 Q86 410 84 400 L82 310 L85 210"
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                    {/* Right leg */}
                    <path d="M115 210 L122 310 L126 400 Q128 410 118 410 L110 410 Q104 410 106 400 L108 310 L105 210"
                        fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" strokeLinecap="round" />
                </g>

                {/* Heart */}
                <g filter={isActive("heart") ? "url(#neonGlow)" : "none"} className={isActive("heart") ? "animate-pulse" : ""}>
                    <path d="M92 108 C88 100 78 100 78 110 C78 122 92 132 100 138 C108 132 122 122 122 110 C122 100 112 100 108 108 Z"
                        fill={fillColor("heart")} stroke={strokeColor("heart")} strokeWidth="1"
                        style={{ filter: glow("heart") }}
                    />
                </g>

                {/* Lungs */}
                <g filter={isActive("lungs") ? "url(#neonGlow)" : "none"}>
                    <ellipse cx="76" cy="115" rx="14" ry="22" fill={fillColor("lungs")} stroke={strokeColor("lungs")} strokeWidth="1"
                        style={{ filter: glow("lungs") }} opacity={isActive("lungs") ? 0.8 : 0.4} />
                    <ellipse cx="124" cy="115" rx="14" ry="22" fill={fillColor("lungs")} stroke={strokeColor("lungs")} strokeWidth="1"
                        style={{ filter: glow("lungs") }} opacity={isActive("lungs") ? 0.8 : 0.4} />
                </g>

                {/* Pancreas (stomach area) */}
                <g filter={isActive("pancreas") ? "url(#neonGlow)" : "none"}>
                    <ellipse cx="100" cy="155" rx="18" ry="10" fill={fillColor("pancreas")} stroke={strokeColor("pancreas")} strokeWidth="1"
                        style={{ filter: glow("pancreas") }} opacity={isActive("pancreas") ? 0.8 : 0.4}
                    />
                </g>

                {/* Kidneys */}
                <g filter={isActive("kidneys") ? "url(#neonGlow)" : "none"}>
                    <ellipse cx="80" cy="170" rx="8" ry="12" fill={fillColor("kidneys")} stroke={strokeColor("kidneys")} strokeWidth="1"
                        style={{ filter: glow("kidneys") }} opacity={isActive("kidneys") ? 0.8 : 0.4}
                    />
                    <ellipse cx="120" cy="170" rx="8" ry="12" fill={fillColor("kidneys")} stroke={strokeColor("kidneys")} strokeWidth="1"
                        style={{ filter: glow("kidneys") }} opacity={isActive("kidneys") ? 0.8 : 0.4}
                    />
                </g>

                {/* Blood vessels / scattered particles for Dengue & Anemia */}
                {(isActive("vessels") || isActive("blood")) && (
                    <g>
                        {Array.from({ length: 20 }, (_, i) => (
                            <circle key={i}
                                cx={50 + Math.random() * 100}
                                cy={80 + Math.random() * 140}
                                r={1.5 + Math.random() * 2}
                                fill={highlight.color}
                                opacity={0.3 + Math.random() * 0.5}
                                className="animate-pulse"
                                style={{ animationDelay: `${Math.random() * 2}s` }}
                            />
                        ))}
                        {/* Main arteries */}
                        <line x1="100" y1="78" x2="100" y2="200" stroke={highlight.color} strokeWidth="1.5" opacity="0.5"
                            style={{ filter: `drop-shadow(0 0 4px ${highlight.color})` }} />
                        <line x1="100" y1="110" x2="76" y2="115" stroke={highlight.color} strokeWidth="1" opacity="0.4" />
                        <line x1="100" y1="110" x2="124" y2="115" stroke={highlight.color} strokeWidth="1" opacity="0.4" />
                    </g>
                )}

                {/* ECG line across chest */}
                <path
                    d="M60 116 L78 116 L82 116 L86 110 L90 122 L94 106 L98 126 L102 108 L106 120 L110 112 L114 116 L140 116"
                    fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.5"
                    strokeDasharray="4 3"
                    className="animate-pulse"
                />

                {/* Disease label */}
                <text x="100" y="240" textAnchor="middle" fill={highlight.color}
                    fontSize="11" fontWeight="600" fontFamily="Space Grotesk, sans-serif"
                    style={{ filter: `drop-shadow(0 0 4px ${highlight.color}60)` }}>
                    {disease}
                </text>
            </svg>
        </div>
    );
}
