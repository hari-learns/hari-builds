"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";

const Hero = () => {
    return (
        <section className="h-screen flex items-center justify-center relative z-10">
            <div className="container-custom">
                <div className="max-w-4xl">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="block text-[#22d3ee] font-mono text-base mb-5"
                    >
                        Hi, my name is
                    </motion.span>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-4xl md:text-7xl font-bold text-[#e4e4e7] mb-4 tracking-tight"
                    >
                        Hariharan R P
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="text-2xl md:text-5xl font-semibold text-[#71717a] mb-6 tracking-tight"
                    >
                        Fullstack/AI Engineer
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="text-lg text-[#71717a] max-w-2xl mb-10 leading-relaxed"
                    >
                        Full-stack engineer with 4+ years building enterprise systems and modern SaaS applications. Specialized in AI-augmented development leveraging LLMs, context management, and prompt engineering to ship production-grade applications 10x faster.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <a href="#projects" className="hero-cta group">
                            View My Work
                            <ArrowDown className="w-4 h-4 arrow group-hover:translate-y-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
