"use client";

import React from "react";
import { motion } from "framer-motion";

const MinimalValue = () => {
    return (
        <section className="py-24 relative z-10">
            <div className="max-w-3xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-2">Philosophy</h2>
                    <div className="h-[1px] w-full bg-zinc-800"></div>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h3 className="text-lg font-bold text-zinc-100 mb-4">The 10x Mindset</h3>
                        <p className="text-zinc-400 leading-relaxed mb-6">
                            It's vital we build systems that prevent bugs. Recently, I turned a security bottleneck into an automated workflow, saving hours per sprint for the entire team.
                        </p>
                        <blockquote className="border-l-2 border-zinc-700 pl-4 italic text-zinc-500">
                            "Automate the boring. Master the complex. Ship the impossible."
                        </blockquote>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-lg font-bold text-zinc-100 mb-4">Strategic AI</h3>
                        <p className="text-zinc-400 leading-relaxed mb-4">
                            I architect workflows where LLMs handle the heavy lifting so humans can focus on high-level logic.
                        </p>
                        <ul className="space-y-2 text-zinc-500 font-mono text-sm">
                            <li>• Context-aware workflows</li>
                            <li>• Cost-optimized routing</li>
                            <li>• Rapid prototyping</li>
                        </ul>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default MinimalValue;
