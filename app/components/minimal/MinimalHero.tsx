"use client";

import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Github, Linkedin, Mail, Twitter, Terminal, Cpu, Globe } from "lucide-react";

const MinimalHero = () => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseX = useSpring(x, { stiffness: 500, damping: 100 });
    const mouseY = useSpring(y, { stiffness: 500, damping: 100 });

    function onMouseMove({ currentTarget, clientX, clientY }: React.MouseEvent) {
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        x.set((clientX - left) / width - 0.5);
        y.set((clientY - top) / height - 0.5);
    }

    const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
    const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);

    return (
        <section className="min-h-[80vh] flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 py-20 relative z-10">
            {/* Text Content */}
            <div className="max-w-xl text-center md:text-left order-2 md:order-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold text-zinc-100 tracking-tighter mb-6">
                        Hariharan
                    </h1>
                    <h2 className="text-xl md:text-2xl text-zinc-400 font-mono mb-8">
                        AI-Native Developer & <br />
                        <span className="text-zinc-100">Fullstack Architect</span>
                    </h2>
                    <p className="text-zinc-500 leading-relaxed text-lg mb-8 max-w-md mx-auto md:mx-0">
                        I build systems that scale and matter. Leveraging AI as a force multiplier to ship faster, better, and with zero friction.
                    </p>

                    <div className="flex items-center justify-center md:justify-start gap-6 text-zinc-400">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100 transition-colors">
                            <Github size={24} />
                        </a>
                        <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100 transition-colors">
                            <Linkedin size={24} />
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-100 transition-colors">
                            <Twitter size={24} />
                        </a>
                        <a href="mailto:hello@example.com" className="hover:text-zinc-100 transition-colors">
                            <Mail size={24} />
                        </a>
                    </div>
                </motion.div>
            </div>

            {/* ID Card Animation */}
            <div className="perspective-1000 order-1 md:order-2">
                <motion.div
                    style={{
                        rotateX,
                        rotateY,
                        transformStyle: "preserve-3d",
                    }}
                    onMouseMove={onMouseMove}
                    onMouseLeave={() => {
                        x.set(0);
                        y.set(0);
                    }}
                    className="w-[320px] h-[480px] bg-zinc-900 rounded-xl border border-zinc-800 relative group cursor-pointer shadow-2xl shadow-black/50"
                >
                    {/* Card Content */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between" style={{ transform: "translateZ(20px)" }}>
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <Terminal size={24} className="text-zinc-100" />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-mono text-zinc-500">ID NUMBER</div>
                                <div className="text-sm font-mono text-zinc-300">AI-NAT-001</div>
                            </div>
                        </div>

                        {/* Photo Area */}
                        <div className="w-full aspect-square bg-zinc-800 rounded-lg border border-zinc-700 overflow-hidden relative group-hover:border-zinc-600 transition-colors">
                            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                                <span className="text-6xl font-bold text-zinc-700 select-none">H</span>
                            </div>
                            {/* Scanline overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none"></div>
                        </div>

                        {/* Footer Info */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-mono text-green-500">SYSTEM ONLINE</span>
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-100">Hariharan</h3>
                            <p className="text-sm text-zinc-500 font-mono">10x Engineer // Architect</p>
                        </div>
                    </div>

                    {/* Holographic/Glass Effect Overlay */}
                    <div
                        className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{ transform: "translateZ(30px)" }}
                    />
                </motion.div>
            </div>
        </section>
    );
};

export default MinimalHero;
