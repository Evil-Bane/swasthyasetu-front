import type { Metadata } from "next";
import { Inter, Space_Grotesk, Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-space",
});

const orbitron = Orbitron({
    subsets: ["latin"],
    display: "swap",
    variable: "--font-orbitron",
});

export const metadata: Metadata = {
    title: "SwasthyaSetu — Intelligent Hospital Management",
    description:
        "AI-powered hospital management platform for real-time bed tracking, patient flow optimization, and predictive analytics.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} ${orbitron.variable}`}>
            <body className="bg-[#0a0e1a] text-white antialiased font-sans">{children}</body>
        </html>
    );
}
