"use client";
import { useEffect, useRef, useState } from "react";
import { X, Camera, Video } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    patientName?: string;
}

export default function WebcamModal({ isOpen, onClose, patientName }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        let s: MediaStream | null = null;

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then((mediaStream) => {
                s = mediaStream;
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            })
            .catch(() => setError("Camera permission denied or not available"));

        return () => {
            s?.getTracks().forEach((t) => t.stop());
            setStream(null);
            setError(null);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={onClose}>
            <div className="relative w-full max-w-2xl mx-4 rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Video className="w-4 h-4 text-red-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold">Live Camera Feed</h3>
                            {patientName && (
                                <p className="text-xs text-white/40">{patientName}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 ml-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-xs text-red-400 font-medium">LIVE</span>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Video */}
                <div className="relative aspect-video bg-black">
                    {error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                            <Camera className="w-12 h-12 text-white/20" />
                            <p className="text-sm text-white/40">{error}</p>
                        </div>
                    ) : (
                        <>
                            <video ref={videoRef} autoPlay playsInline muted
                                className="w-full h-full object-cover" />
                            {/* Scan lines overlay */}
                            <div className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.02) 2px, rgba(0,255,200,0.02) 4px)",
                                }} />
                            {/* Corner brackets */}
                            <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/50" />
                            <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/50" />
                            <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/50" />
                            <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/50" />
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-white/10 flex items-center justify-center">
                    <p className="text-xs text-white/30">Camera feed for diagnostic purposes only</p>
                </div>
            </div>
        </div>
    );
}
