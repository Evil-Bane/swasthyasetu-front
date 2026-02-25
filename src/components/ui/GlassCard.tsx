"use client";

interface Props {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    onClick?: () => void;
    hoverScale?: boolean;
}

export default function GlassCard({ children, className = "", glowColor, onClick, hoverScale }: Props) {
    return (
        <div
            onClick={onClick}
            className={`
                relative rounded-2xl overflow-hidden
                bg-gradient-to-br from-white/[0.05] to-white/[0.02]
                border border-white/[0.07]
                backdrop-blur-xl transition-all duration-300
                hover:from-white/[0.07] hover:to-white/[0.04]
                hover:border-white/[0.12]
                hover:shadow-xl
                ${hoverScale ? "hover:scale-[1.02]" : ""}
                ${onClick ? "cursor-pointer" : ""}
                ${className}
            `}
            style={{
                boxShadow: glowColor
                    ? `0 0 30px ${glowColor}10, 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)`
                    : "0 4px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
        >
            {/* Top highlight line */}
            <div className="absolute top-0 left-[10%] right-[10%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            {children}
        </div>
    );
}
