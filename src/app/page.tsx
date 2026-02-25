"use client";

import dynamic from "next/dynamic";

/* 
   Homepage — pure cinematic scroll that auto-redirects to /dashboard.
   No hero template, no footer, no CTA — just the cinematic experience.
   SwasthyaScroll handles loading, scroll animation, and redirect.
*/
const SwasthyaScroll = dynamic(
    () => import("@/components/SwasthyaScroll"),
    { ssr: false }
);

export default function HomePage() {
    return (
        <>
            <SwasthyaScroll />
        </>
    );
}
