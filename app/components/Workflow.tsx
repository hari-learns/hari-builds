"use client";

import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lightbulb, PenTool, Code2, Lock, ShieldCheck, Rocket, TrendingUp } from 'lucide-react';

const Workflow = () => {
    const { isTech } = useTheme();
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);

    const steps = [
        { icon: Lightbulb, title: "IDEATE", desc: "Problem & Solution", x: 5, y: 50 },
        { icon: PenTool, title: "ARCHITECT", desc: "System Design", x: 20, y: 20 },
        { icon: Code2, title: "BUILD", desc: "AI-Augmented", x: 35, y: 80 },
        { icon: Lock, title: "FORTIFY", desc: "Zero Trust & Hardening", x: 50, y: 20 },
        { icon: ShieldCheck, title: "TEST", desc: "QA & Validation", x: 65, y: 80 },
        { icon: Rocket, title: "DEPLOY", desc: "CI/CD Pipeline", x: 80, y: 20 },
        { icon: TrendingUp, title: "SCALE", desc: "Growth & Monitor", x: 95, y: 50 }
    ];

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger);

        const ctx = gsap.context(() => {
            // Animate the SVG Path drawing
            const path = pathRef.current;
            const length = path?.getTotalLength() || 0;

            if (path) {
                gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });

                gsap.to(path, {
                    strokeDashoffset: 0,
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 70%",
                        end: "bottom 70%",
                        scrub: 1
                    }
                });
            }

            // Animate Steps popping up
            stepsRef.current.forEach((step, index) => {
                if (!step) return;

                gsap.fromTo(step,
                    { scale: 0, opacity: 0 },
                    {
                        scale: 1,
                        opacity: 1,
                        duration: 0.5,
                        ease: "back.out(1.7)",
                        scrollTrigger: {
                            trigger: containerRef.current,
                            start: `top ${70 - (index * 5)}%`,
                            toggleActions: "play none none reverse"
                        }
                    }
                );
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className="relative py-24 my-12 overflow-hidden">
            <h2 className="text-center text-3xl md:text-4xl font-bold text-[#e4e4e7] mb-20">How I Ship</h2>

            <div className="relative max-w-7xl mx-auto h-[400px] md:h-[300px]">

                {/* Connecting Line (SVG) */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible" viewBox="0 0 1200 300" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.5" />
                            <stop offset="50%" stopColor="#4a7dff" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.5" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    {/* 
                        Path points matching the % positions (1200 width, 300 height):
                        5% -> 60, 50% -> 150
                        20% -> 240, 20% -> 60
                        35% -> 420, 80% -> 240
                        50% -> 600, 20% -> 60
                        65% -> 780, 80% -> 240
                        80% -> 960, 20% -> 60
                        95% -> 1140, 50% -> 150
                    */}
                    <path
                        ref={pathRef}
                        d="M 60,150 C 120,150 150,60 240,60 C 330,60 330,240 420,240 C 510,240 510,60 600,60 C 690,60 690,240 780,240 C 870,240 870,60 960,60 C 1050,60 1080,150 1140,150"
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        filter="url(#glow)"
                        className="hidden md:block"
                    />
                    {/* Mobile straight line */}
                    <line
                        x1="50%" y1="0" x2="50%" y2="100%"
                        stroke="url(#lineGradient)"
                        strokeWidth="2"
                        className="md:hidden"
                    />
                </svg>

                {/* Steps */}
                <div className="w-full h-full relative z-10">
                    {steps.map((item, index) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={index}
                                ref={el => { stepsRef.current[index] = el; }}
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center group hidden md:flex"
                                style={{
                                    left: `${item.x}%`,
                                    top: `${item.y}%`
                                }}
                            >
                                <div className={`
                                    w-14 h-14 rounded-full flex items-center justify-center mb-4 relative
                                    bg-[#0a0a0f] border-2 border-[#ffffff10] shadow-[0_0_15px_rgba(0,0,0,0.5)]
                                    group-hover:border-[#4a7dff] group-hover:shadow-[0_0_20px_rgba(74,125,255,0.4)]
                                    transition-all duration-300 z-20
                                `}>
                                    <Icon size={24} className="text-[#a1a1aa] group-hover:text-[#4a7dff] transition-colors" />

                                    {/* 10X Badge - Integrated into the icon ring */}
                                    {item.title === "BUILD" && (
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                            <span className="text-[10px] font-bold text-[#4a7dff] bg-[#4a7dff]/10 px-2 py-1 rounded-full border border-[#4a7dff]/20 animate-pulse shadow-[0_0_10px_rgba(74,125,255,0.2)]">
                                                ⚡ 10X FASTER
                                            </span>
                                            {/* Connecting line to badge */}
                                            <div className="w-[1px] h-3 bg-[#4a7dff]/30 mx-auto mt-[-1px]"></div>
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-sm font-bold tracking-widest text-[#e4e4e7] mb-1 font-mono">
                                    {item.title}
                                </h3>
                                <p className="text-xs text-[#71717a] max-w-[120px]">
                                    {item.desc}
                                </p>
                            </div>
                        );
                    })}

                    {/* Mobile Layout (Vertical Stack) */}
                    <div className="md:hidden flex flex-col gap-12 items-center pt-8">
                        {steps.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={`mobile-${index}`} className="flex flex-col items-center text-center relative z-10 bg-[#0a0a0f] p-4 rounded-xl border border-[#ffffff10]">
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-[#0a0a0f] border border-[#ffffff20]">
                                        <Icon size={20} className="text-[#a1a1aa]" />
                                    </div>
                                    {item.title === "BUILD" && (
                                        <span className="text-[10px] font-bold text-[#4a7dff] mb-2 bg-[#4a7dff]/10 px-2 py-0.5 rounded-full">
                                            ⚡ 10X FASTER
                                        </span>
                                    )}
                                    <h3 className="text-sm font-bold text-[#e4e4e7] mb-1">{item.title}</h3>
                                    <p className="text-xs text-[#71717a]">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Workflow;
