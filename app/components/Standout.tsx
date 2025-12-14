"use client";

import React, { useEffect, useState } from "react";
import { motion, useAnimation } from "framer-motion";
import { Sparkles, Target, Lightbulb, MessageSquare, TrendingUp, Brain, Zap, Users, Award, Code } from "lucide-react";

interface Quality {
    icon: React.ReactElement;
    text: string;
}

const QualityBubble = ({ quality, index, containerWidth, containerHeight }: { quality: Quality; index: number; containerWidth: number; containerHeight: number }) => {
    const controls = useAnimation();

    useEffect(() => {
        if (containerWidth === 0 || containerHeight === 0) return;

        const moveQuality = async () => {
            // Bubble dimensions (approximate max width)
            const bubbleWidth = 250;
            const bubbleHeight = 60;

            // Random starting position with stricter padding
            // Ensure we never spawn too close to the edge
            const maxX = Math.max(0, containerWidth - bubbleWidth - 40);
            const maxY = Math.max(0, containerHeight - bubbleHeight - 40);

            let currentX = Math.random() * maxX + 20;
            let currentY = Math.random() * maxY + 20;

            controls.set({ x: currentX, y: currentY, opacity: 0 });
            await controls.start({ opacity: 1, transition: { duration: 1 } });

            while (true) {
                const nextX = Math.random() * maxX + 20;
                const nextY = Math.random() * maxY + 20;

                const distance = Math.sqrt((nextX - currentX) ** 2 + (nextY - currentY) ** 2);
                const speed = 25; // Slightly slower for smoother movement
                const duration = distance / speed;

                await controls.start({
                    x: nextX,
                    y: nextY,
                    transition: {
                        duration: duration,
                        ease: "linear"
                    }
                });

                currentX = nextX;
                currentY = nextY;
            }
        };

        // Stagger the start of each bubble
        setTimeout(() => {
            moveQuality();
        }, index * 200);
    }, [containerWidth, containerHeight, controls, index]);

    return (
        <motion.div
            animate={controls}
            className="absolute z-10"
            initial={{ opacity: 0 }}
        >
            <div className="bg-[#111118] px-4 py-3 rounded-lg border border-[#c084fc]/30 hover:border-[#c084fc]/60 transition-all duration-300 flex items-center gap-3 shadow-[0_0_20px_rgba(192,132,252,0.2)] hover:shadow-[0_0_30px_rgba(192,132,252,0.4)] cursor-pointer group">
                <div className="w-8 h-8 rounded-md bg-[#c084fc]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#c084fc]/20 transition-colors">
                    <div className="text-[#c084fc] w-4 h-4">
                        {quality.icon}
                    </div>
                </div>
                <p className="text-[#e4e4e7] font-medium text-sm whitespace-nowrap">
                    {quality.text}
                </p>
            </div>
        </motion.div>
    );
};

const Standout = () => {
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const updateSize = () => {
            const width = window.innerWidth * 0.7;
            const height = Math.min(630, window.innerHeight * 0.7);
            setContainerSize({ width, height });
        };

        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, []);

    const qualities: Quality[] = [
        { icon: <Brain className="w-4 h-4" />, text: "Problem solver" },
        { icon: <Sparkles className="w-4 h-4" />, text: "Creative (without AI)" },
        { icon: <Target className="w-4 h-4" />, text: "Context management expert" },
        { icon: <TrendingUp className="w-4 h-4" />, text: "Lead" },
        { icon: <Lightbulb className="w-4 h-4" />, text: "Versatility" },
        { icon: <MessageSquare className="w-4 h-4" />, text: "Marketing" },
        { icon: <Brain className="w-4 h-4" />, text: "Math" },
        { icon: <Zap className="w-4 h-4" />, text: "Learn fast" },
        { icon: <MessageSquare className="w-4 h-4" />, text: "Communicate well" },
        { icon: <Target className="w-4 h-4" />, text: "Analysis" },
        { icon: <Award className="w-4 h-4" />, text: "actually funny" }
    ];

    return (
        <section className="py-24 md:py-32 relative z-10 bg-gradient-to-b from-transparent via-[#c084fc]/5 to-transparent">
            <div className="container-custom">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <span className="text-[#c084fc] font-mono text-xl block mb-4">What Makes Me Different</span>
                    <h2 className="text-3xl md:text-5xl font-bold text-[#e4e4e7] mb-6">
                        Not So Common <span className="text-[#c084fc]">Qualities</span>
                    </h2>
                    <p className="text-[#a1a1aa] text-lg max-w-2xl mx-auto">
                        Beyond the tech stack and frameworks, here's what truly sets me apart.
                    </p>
                </motion.div>

                {/* Animated Quality Cloud Container */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative mx-auto rounded-2xl border-2 border-[#c084fc]/20 bg-[#0a0a0f]/50 backdrop-blur-sm overflow-hidden"
                    style={{
                        width: `${containerSize.width}px`,
                        height: `${containerSize.height}px`,
                        maxWidth: '100%'
                    }}
                >
                    {/* Background grid pattern */}
                    <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'radial-gradient(circle, #c084fc 1px, transparent 1px)',
                        backgroundSize: '30px 30px'
                    }}></div>

                    {/* Floating qualities */}
                    {qualities.map((quality, index) => (
                        <QualityBubble
                            key={index}
                            quality={quality}
                            index={index}
                            containerWidth={containerSize.width}
                            containerHeight={containerSize.height}
                        />
                    ))}

                    {/* Corner accents */}
                    <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#c084fc]/40 rounded-tl-2xl"></div>
                    <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#c084fc]/40 rounded-tr-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#c084fc]/40 rounded-bl-2xl"></div>
                    <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#c084fc]/40 rounded-br-2xl"></div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-24 text-center relative"
                >
                    {/* Glow effect behind the text */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-32 bg-[#c084fc]/10 blur-[60px] -z-10 rounded-full"></div>

                    <h3 className="text-2xl md:text-4xl font-bold text-[#e4e4e7] tracking-tight mb-4">
                        Having me on your team is a <span className="font-mono text-[#c084fc] inline-block border-b-2 border-[#c084fc] border-dashed pb-1">cheat code</span>.
                    </h3>

                    <div className="flex justify-center gap-3 text-[#71717a] font-mono text-xs md:text-sm tracking-widest opacity-70">
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">↑</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">↑</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">↓</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">↓</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">←</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">→</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">←</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">→</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">B</span>
                        <span className="hover:text-[#c084fc] transition-colors cursor-default">A</span>
                        <span className="text-[#c084fc] font-bold animate-pulse">START</span>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Standout;
