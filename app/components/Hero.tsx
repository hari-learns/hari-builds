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
                        className="block text-[#c084fc] font-mono text-base mb-5"
                    >
                        Hi, Hari here and
                    </motion.span>

                    <h1
                        className="text-4xl md:text-7xl font-bold text-[#e4e4e7] mb-6 tracking-tight"
                    >
                        I can build things that <br />
                        <span className="text-[#c084fc]">solve real problems.</span>
                    </h1>

                    <p
                        className="hero-text text-lg text-[#a1a1aa] max-w-2xl mb-10 leading-relaxed"
                    >
                        I'm an AI-native developer who ships products that work, scale, and matter. I use AI as a force multiplier - not just for myself, but for entire teams.
                        <br /><br />
                        I'm driven by curiosity and I stay ahead of the curve. Whether it's architecting backend systems, optimizing AI workflows, or leading teams to ship faster <br /> I get things done.
                    </p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <a href="#projects" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c084fc]/10 text-[#c084fc] border border-[#c084fc]/20 rounded-lg hover:bg-[#c084fc]/20 transition-all group">
                            View My Work
                            <ArrowDown className="w-4 h-4 group-hover:translate-y-1 transition-transform" />
                        </a>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
