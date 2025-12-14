"use client";

import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const TechBackground = () => {
    const { isTech } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!isTech || !mounted) return null;

    return (
        <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
            {/* Tech Grid */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_49px,rgba(255,255,255,0.03)_49px,rgba(255,255,255,0.03)_50px),repeating-linear-gradient(90deg,transparent,transparent_49px,rgba(255,255,255,0.03)_49px,rgba(255,255,255,0.03)_50px)] animate-pulse" />

            {/* Scanlines */}
            <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.02)_0px,transparent_1px,transparent_2px,rgba(255,255,255,0.02)_3px)] animate-[scanline_8s_linear_infinite]" />

            {/* Particles - CSS only implementation for performance */}
            <div className="particles-container absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-[2px] h-[2px] bg-[#4a7dff] rounded-full shadow-[0_0_3px_#4a7dff]"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animation: `particle-float ${15 + Math.random() * 10}s infinite linear`,
                            animationDelay: `${Math.random() * -20}s`,
                            opacity: Math.random() * 0.8 + 0.2
                        }}
                    />
                ))}
            </div>

            <style jsx>{`
                @keyframes scanline {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
                }
                @keyframes particle-float {
                    0% { transform: translateY(0) translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(-100px) translateX(${Math.random() * 50 - 25}px); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default TechBackground;
